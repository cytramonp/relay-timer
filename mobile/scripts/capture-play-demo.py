"""Record the foreground-service review example on a disposable CI emulator."""
from pathlib import Path
import hashlib
import json
import os
import re
import subprocess
import time
import xml.etree.ElementTree as ET

def adb(*args):
    return subprocess.check_output(['adb', *args], text=True, timeout=35)

assert os.environ.get('CI') == 'true' and adb('get-serialno').strip().startswith('emulator-'), 'Disposable CI emulator only'
root = Path(__file__).resolve().parents[1]
output = root / 'play-demo'
output.mkdir(exist_ok=True)
apk = next((root / 'android/app/build/outputs/apk/release').glob('*.apk'))

def tree():
    for _ in range(3):
        p = subprocess.run(['adb', 'shell', 'uiautomator', 'dump', '--windows', '/sdcard/demo-ui.xml'], text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=35)
        if p.returncode == 0 and 'ERROR' not in p.stdout:
            return ET.fromstring(adb('shell', 'cat', '/sdcard/demo-ui.xml'))
    raise AssertionError('No fresh accessibility snapshot')

def find(t, text=None, identifier=None):
    for n in t.iter('node'):
        if text is not None and n.attrib.get('text') != text: continue
        if identifier is not None and not n.attrib.get('resource-id', '').endswith(identifier): continue
        a,b,c,d = map(int, re.findall(r'\d+', n.attrib.get('bounds','[0,0][0,0]')))
        if c > a and d > b: return n
    raise AssertionError('Missing demo control: ' + str(text or identifier))

def tap(n):
    a,b,c,d = map(int, re.findall(r'\d+', n.attrib['bounds']))
    adb('shell','input','tap',str((a+c)//2),str((b+d)//2)); time.sleep(1)

def capture(name):
    with (output/name).open('wb') as f:
        subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True,timeout=20)

adb('install','-r',str(apk))
adb('shell','appops','set','com.corptimer.app','SYSTEM_ALERT_WINDOW','allow')
adb('shell','am','start','-W','-n','com.corptimer.app/.MainActivity')
for _ in range(20):
    time.sleep(2)
    t=tree()
    if any(n.attrib.get('text')=='Full access · trial' for n in t.iter('node')): break
else: raise AssertionError('Trial initialization failed')
tap(find(t,identifier='meeting-next')); time.sleep(20)
adb('shell','am','start','-W','-a','android.intent.action.VIEW','-d','corptimer://floating','com.corptimer.app'); time.sleep(2)
button=find(tree(),text='Open floating timer')
w,h=map(int,re.findall(r'(\d+)x(\d+)',adb('shell','wm','size'))[-1])
height=min(1920,int(h*720/w)//2*2)
record=subprocess.Popen(['adb','shell','screenrecord','--size',f'720x{height}','--time-limit','45','/sdcard/floating-service-demo.mp4'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
    time.sleep(1); tap(button)
    adb('shell','input','keyevent','KEYCODE_HOME'); time.sleep(2)
    find(tree(),text='Welcome')
    tap(find(tree(),text='Next')); find(tree(),text='Alex')
    tap(find(tree(),text='Pause')); find(tree(),text='Resume')
    tap(find(tree(),text='Undo')); find(tree(),text='Welcome')
    capture('floating-service-demo.png')
    tap(find(tree(),text='Close'))
    record.wait(timeout=55)
    adb('pull','/sdcard/floating-service-demo.mp4',str(output/'floating-service-demo.mp4'))
    (output/'demo-provenance.json').write_text(json.dumps({'apkRunId':os.environ['APK_RUN_ID'],'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'scriptRevision':os.environ['GITHUB_SHA'],'scope':'Actual API36 emulator recording: user opens overlay; Home; Next/Pause/Undo/Close over launcher. Overlay permission pre-granted on disposable emulator, not real-device consent.'},indent=2)+'\n',encoding='utf-8')
finally:
    if record.poll() is None: record.terminate()
