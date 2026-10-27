"""Run only on the GitHub/macOS simulator runner; does not sign or submit an app."""
import json
from pathlib import Path
import subprocess
import time
import os

def run(*args):
    return subprocess.check_output(args, text=True)

root = Path(__file__).resolve().parents[1]
app = root / 'ios-build/Build/Products/Release-iphonesimulator/CorpTimer.app'
output = root / 'native-captures'
output.mkdir(exist_ok=True)
inventory = json.loads(run('xcrun', 'simctl', 'list', 'devices', 'available', '--json'))
devices = [d for runtime, rows in inventory['devices'].items() if 'iOS' in runtime for d in rows if d.get('isAvailable')]
for category in ['iPhone', 'iPad']:
    candidates = [d for d in devices if d['name'].startswith(category)]
    if not candidates:
        raise RuntimeError(f'No available {category} simulator on this runner')
    device = candidates[0]
    udid = device['udid']
    print(f'Launching {device["name"]} ({udid})', flush=True)
    if device['state'] != 'Booted':
        run('xcrun', 'simctl', 'boot', udid)
    run('xcrun', 'simctl', 'bootstatus', udid, '-b')
    run('xcrun', 'simctl', 'install', udid, str(app))
    run('xcrun', 'simctl', 'launch', udid, 'com.corptimer.app')
    time.sleep(5)
    run('xcrun', 'simctl', 'io', udid, 'screenshot', str(output / f'{category.lower()}-ios-home.png'))
    subprocess.run([str(Path.home()/'.maestro/bin/maestro'),'--device',udid,'test','--test-output-dir',str(output/category.lower()),'-e',f'DEVICE_CLASS={category.lower()}',str(root/'tests/native-smoke.yaml')],check=True,cwd=root,env={**os.environ,'MAESTRO_CLI_NO_ANALYTICS':'1'},timeout=600)
    run('xcrun','simctl','ui',udid,'appearance','dark')
    run('xcrun','simctl','ui',udid,'content_size','accessibility-medium')
    run('xcrun','simctl','terminate',udid,'com.corptimer.app')
    run('xcrun','simctl','launch',udid,'com.corptimer.app')
    time.sleep(3)
    run('xcrun','simctl','io',udid,'screenshot',str(output / f'{category.lower()}-ios-dark-large-text.png'))
    run('xcrun', 'simctl', 'shutdown', udid)
