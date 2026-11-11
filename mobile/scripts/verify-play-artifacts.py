"""Fail on wrong API/permissions, debug bundle certificates or unaligned native ELF."""
from pathlib import Path
import hashlib, json, os, struct, subprocess, zipfile

root = Path(__file__).resolve().parents[1]
apk = next((root / 'android/app/build/outputs/apk/release').glob('*.apk'))
sdk = Path(os.environ['ANDROID_HOME'])
aapt_name = 'aapt.exe' if os.name == 'nt' else 'aapt'
aapt = sorted(sdk.glob(f'build-tools/*/{aapt_name}'))[-1]
badging = subprocess.check_output([str(aapt), 'dump', 'badging', str(apk)], encoding='utf-8')
permissions = subprocess.check_output([str(aapt), 'dump', 'permissions', str(apk)], encoding='utf-8')
config = json.loads((root / 'app.json').read_text(encoding='utf-8'))['expo']
package = config['android']['package']
version_code = config['android']['versionCode']
version = config['version']
assert f"package: name='{package}' versionCode='{version_code}' versionName='{version}'" in badging, badging[:1500]
assert "targetSdkVersion:'36'" in badging, badging[:1500]
for forbidden in ['RECORD_AUDIO', 'READ_MEDIA_IMAGES', 'READ_MEDIA_VIDEO', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE']:
    assert forbidden not in permissions, permissions
assert 'com.android.vending.BILLING' in permissions
checked = []
with zipfile.ZipFile(apk) as z:
    for name in z.namelist():
        if not name.endswith('.so'): continue
        data = z.read(name)
        assert data[:4] == b'\x7fELF'
        elf64 = data[4] == 2
        fmt = '<' if data[5] == 1 else '>'
        offset = struct.unpack_from(fmt + ('Q' if elf64 else 'I'), data, 32 if elf64 else 28)[0]
        size, count = struct.unpack_from(fmt + 'HH', data, 54 if elf64 else 42)
        for i in range(count):
            pos = offset + i * size
            if struct.unpack_from(fmt + 'I', data, pos)[0] != 1: continue
            alignment = struct.unpack_from(fmt + ('Q' if elf64 else 'I'), data, pos + (48 if elf64 else 28))[0]
            assert alignment >= 16384, f'{name}: LOAD alignment {alignment}'
        checked.append(name)
    assert any(b'CorpTimerClock' in z.read(n) for n in z.namelist() if n.endswith('.dex')), 'Native monotonic clock was not linked'
    bundle = z.read('assets/index.android.bundle')
    assert b'cytramonp@gmail.com' not in bundle
    assert b'corptimer_pro_yearly' in bundle
    assert b'Google Play purchases are being prepared' in bundle
report = {'version': version, 'versionCode': version_code, 'targetSdk': 36, 'package': package, 'apkSha256': hashlib.sha256(apk.read_bytes()).hexdigest(), 'nativeLibraries16KB': len(checked), 'sensitiveMediaPermissions': False, 'recipientAddressInBundle': False, 'storePurchasesEnabled': False}
aab = root / 'android/app/build/outputs/bundle/release/app-release.aab'
if aab.exists():
    cert = subprocess.check_output(['keytool', '-printcert', '-jarfile', str(aab)], text=True)
    assert 'Android Debug' not in cert, 'Debug signing is not allowed for a Play upload'
    assert 'CorpTimer Upload' in cert, cert
    report['aabSha256'] = hashlib.sha256(aab.read_bytes()).hexdigest()
(root / 'play-artifact-report.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
