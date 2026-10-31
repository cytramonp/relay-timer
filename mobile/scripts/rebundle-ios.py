"""Test JS-only changes in a verified unchanged iOS simulator native shell.

Not an App Store archive. Refuse reuse if native/config/dependency/assets inputs
changed, and record native-shell versus JavaScript provenance separately.
"""
import hashlib
import json
import os
from pathlib import Path
import plistlib
import subprocess

root = Path(__file__).resolve().parents[1]
repo = root.parent
source_run = os.environ['IOS_NATIVE_RUN']
head = os.environ['GITHUB_SHA']
source = json.loads(subprocess.check_output(
    ['gh', 'api', f'repos/{os.environ["GITHUB_REPOSITORY"]}/actions/runs/{source_run}'], text=True))
assert source['head_repository']['full_name'] == os.environ['GITHUB_REPOSITORY'], 'Untrusted native shell origin'
native = source['head_sha']
inputs = ['mobile/modules', 'mobile/app.json', 'mobile/package.json', 'mobile/package-lock.json',
          'mobile/assets', 'mobile/plugins', 'mobile/metro.config.js', 'mobile/babel.config.js']
changed = subprocess.check_output(['git', 'diff', '--name-only', native, head, '--', *inputs], cwd=repo, text=True)
assert not changed.strip(), 'Native inputs changed; use the full iOS build instead: ' + changed
destination = root / 'ios-build/Build/Products/Release-iphonesimulator'
destination.mkdir(parents=True, exist_ok=True)
subprocess.run(['ditto', '-x', '-k', str(root / 'native-shell/corptimer-ios-simulator.zip'), str(destination)], check=True)
app = destination / 'CorpTimer.app'
metadata = plistlib.loads((app / 'Info.plist').read_bytes())
executable = app / metadata['CFBundleExecutable']
native_hash = hashlib.sha256(executable.read_bytes()).hexdigest()
bundle = app / 'main.jsbundle'
old_header = bundle.read_bytes()[:12]
subprocess.run(['npx', 'expo', 'export:embed', '--entry-file', 'node_modules/expo-router/entry.js',
                '--platform', 'ios', '--dev', 'false', '--bytecode', '--bundle-output', str(bundle),
                '--assets-dest', str(app)], check=True, cwd=root, env={**os.environ, 'NODE_ENV': 'production'})
assert bundle.read_bytes()[:12] == old_header, 'Hermes bytecode runtime changed; rebuild native shell'
assert hashlib.sha256(executable.read_bytes()).hexdigest() == native_hash, 'Native executable changed'
output = root / 'native-captures'
output.mkdir(exist_ok=True)
(output / 'ios-provenance.json').write_text(json.dumps({
    'nativeRun': source_run, 'nativeSource': native, 'javascriptSource': head,
    'nativeInputsIdentical': True, 'nativeExecutableSha256': native_hash,
    'hermesSha256': hashlib.sha256(bundle.read_bytes()).hexdigest(),
    'version': metadata['CFBundleShortVersionString'], 'build': metadata['CFBundleVersion'],
    'scope': 'Unsigned simulator native runtime QA; not a signed archive or store submission',
}, indent=2))
print('iOS JS bundle updated; native executable and native inputs verified unchanged.')
