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
results = []
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
    for flow, budget in [('native-smoke', 600), ('native-dark', 240)]:
        if flow == 'native-dark':
            run('xcrun','simctl','ui',udid,'appearance','dark')
            run('xcrun','simctl','ui',udid,'content_size','accessibility-medium')
        try:
            subprocess.run([str(Path.home()/'.maestro/bin/maestro'),'--device',udid,'test','--test-output-dir',str(output/category.lower()),'-e',f'DEVICE_CLASS={category.lower()}',str(root/f'tests/{flow}.yaml')],check=True,cwd=root,env={**os.environ,'MAESTRO_CLI_NO_ANALYTICS':'1'},timeout=budget)
            results.append({'device': device['name'], 'flow': flow, 'passed': True})
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
            # Keep independent iPad/dark evidence when XCTest's screenshot
            # server fails on the phone. Aggregate failures; never turn them
            # into a green whole-flow result.
            results.append({'device': device['name'], 'flow': flow, 'passed': False, 'error': str(error)})
            subprocess.run(['xcrun','simctl','io',udid,'screenshot',str(output/f'{category.lower()}-{flow}-failure.png')],timeout=45)
            subprocess.run(['xcrun','simctl','terminate',udid,'com.corptimer.app'],timeout=45)
        (output/'ios-ui-results.json').write_text(json.dumps({'source':os.environ.get('GITHUB_SHA'),'results':results},indent=2))
    run('xcrun', 'simctl', 'shutdown', udid)
assert all(result['passed'] for result in results), 'One or more iOS UI flows failed; see ios-ui-results.json and native logs'
