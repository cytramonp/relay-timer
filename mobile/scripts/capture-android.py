"""Capture the built application on the CI emulator; no production accounts."""
from pathlib import Path
import subprocess
import time

root = Path(__file__).resolve().parents[1]
output = root / 'native-captures'
output.mkdir(exist_ok=True)
apk = next((root / 'android/app/build/outputs/apk/release').glob('*.apk'))

def adb(*args):
    return subprocess.check_output(['adb', *args], text=True)

def capture(name):
    time.sleep(3)
    with (output / name).open('wb') as target:
        subprocess.run(['adb','exec-out','screencap','-p'], stdout=target, check=True)

adb('install','-r',str(apk))
for form in ['phone','tablet']:
    if form == 'tablet':
        adb('shell','wm','size','1200x1920')
        adb('shell','wm','density','240')
    adb('shell','am','force-stop','com.corptimer.app')
    adb('shell','am','start','-W','-n','com.corptimer.app/.MainActivity')
    time.sleep(4)
    # Require the actual app UI, not merely a successful Activity launch.
    adb('shell','uiautomator','dump','/sdcard/corptimer-ui.xml')
    xml=adb('shell','cat','/sdcard/corptimer-ui.xml')
    if 'Make time for it' not in xml:
        capture(f'{form}-android-launch-failed.png')
        raise RuntimeError('CorpTimer catalog did not render: '+xml[:1500])
    capture(f'{form}-android-home.png')
    for path in ['timer/boxing','edit/boxing','history']:
        adb('shell','am','start','-W','-a','android.intent.action.VIEW','-d',f'corptimer://{path}','com.corptimer.app')
        capture(f'{form}-android-{path.split("/")[0]}.png')
    adb('shell','cmd','uimode','night','yes')
    adb('shell','settings','put','system','font_scale','1.3')
    adb('shell','am','start','-W','-a','android.intent.action.VIEW','-d','corptimer://','com.corptimer.app')
    capture(f'{form}-android-dark-large-text.png')
    adb('shell','cmd','uimode','night','no')
    adb('shell','settings','put','system','font_scale','1.0')
