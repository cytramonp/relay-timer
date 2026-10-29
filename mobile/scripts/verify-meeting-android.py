"""Release APK behavior/gesture/overlay evidence on the disposable CI emulator."""
from pathlib import Path
import os
import re
import subprocess
import time
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
output = root / 'native-captures'
output.mkdir(exist_ok=True)
apk = next((root / 'android/app/build/outputs/apk/release').glob('*.apk'))

def adb(*args):
    return subprocess.check_output(['adb', *args], text=True, timeout=35)

def tree():
    adb('shell', 'uiautomator', 'dump', '/sdcard/corptimer-ui.xml')
    return ET.fromstring(adb('shell', 'cat', '/sdcard/corptimer-ui.xml'))

def bounds(node):
    a, b, c, d = map(int, re.findall(r'\d+', node.attrib.get('bounds', '[0,0][0,0]')))
    return a, b, c, d

def find(t, identifier=None, text=None, description=None):
    for node in t.iter('node'):
        props = node.attrib
        if identifier is not None and not props.get('resource-id', '').endswith(identifier): continue
        if text is not None and props.get('text') != text: continue
        if description is not None and props.get('content-desc') != description: continue
        a, b, c, d = bounds(node)
        if c > a and d > b: return node
    return None

def center(node):
    a, b, c, d = bounds(node)
    return (a + c) // 2, (b + d) // 2

def tap_node(node):
    if node is None: raise AssertionError('Required native control was absent')
    x, y = center(node); adb('shell', 'input', 'tap', str(x), str(y)); time.sleep(0.5)

def capture(name):
    time.sleep(1)
    with (output / name).open('wb') as target:
        subprocess.run(['adb', 'exec-out', 'screencap', '-p'], stdout=target, check=True, timeout=20)

def dimensions():
    text = adb('shell', 'wm', 'size')
    return tuple(map(int, re.findall(r'(\d+)x(\d+)', text)[-1]))

def swipe_up():
    w, h = dimensions(); adb('shell', 'input', 'swipe', str(w // 2), str(int(h * .76)), str(w // 2), str(int(h * .36)), '550'); time.sleep(0.5)

def scroll_to(identifier):
    for _ in range(12):
        t = tree(); node = find(t, identifier=identifier)
        if node is not None: return t, node
        swipe_up()
    raise AssertionError('Could not reach ' + identifier)

def open_path(path):
    adb('shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', 'corptimer://' + path, 'com.corptimer.app'); time.sleep(1)

def launch():
    adb('shell', 'am', 'force-stop', 'com.corptimer.app')
    adb('shell', 'am', 'start', '-W', '-n', 'com.corptimer.app/.MainActivity')
    for _ in range(6):
        time.sleep(2)
        if 'Welcome' in ET.tostring(tree(), encoding='unicode'): return
    raise AssertionError('Meeting did not render after launch')

def report_name(t, row):
    node = find(t, identifier=f'agenda-name-{row}')
    return node.attrib.get('text', '') if node is not None else ''

adb('install', '-r', str(apk))
try:
    for form in ['phone', 'tablet']:
        if form == 'tablet':
            adb('shell', 'wm', 'size', '1200x1920'); adb('shell', 'wm', 'density', '240')
        adb('shell', 'pm', 'clear', 'com.corptimer.app')
        # Grant only on this disposable emulator. Hardware permission consent is a separate test.
        adb('shell', 'appops', 'set', 'com.corptimer.app', 'SYSTEM_ALERT_WINDOW', 'allow')
        launch()
        capture(f'{form}-android-meeting-ready.png')
        t, _ = scroll_to('drag-handle-2')
        w, h = dimensions()
        node = find(t, identifier='drag-handle-2')
        if center(node)[1] > h * .70:
            adb('shell', 'input', 'swipe', str(w // 2), str(int(h * .65)), str(w // 2), str(int(h * .42)), '500'); time.sleep(0.5); t = tree()
        first, second = find(t, identifier='drag-handle-1'), find(t, identifier='drag-handle-2')
        if first is None or second is None: raise AssertionError('Drag handles not visible together')
        video_height = min(1920, int(h * 720 / w) // 2 * 2)
        record = subprocess.Popen(['adb', 'shell', 'screenrecord', '--size', f'720x{video_height}', '--time-limit', '12', f'/sdcard/{form}-reorder.mp4'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        x, y = center(first); tx, ty = center(second)
        adb('shell', 'input', 'swipe', str(x), str(y), str(tx), str(ty), '2200'); time.sleep(1)
        t = tree()
        assert report_name(t, 1) == 'Morgan', 'Drag did not move Morgan into slot 2'
        assert report_name(t, 2) == 'Alex', 'Drag did not move Alex into slot 3'
        capture(f'{form}-android-agenda-reordered.png')
        record.wait(timeout=20); adb('pull', f'/sdcard/{form}-reorder.mp4', str(output / f'{form}-android-reorder.mp4'))
        open_path('')
        # Return to the top using native scrolling; re-opening a tab can retain its offset.
        for _ in range(4):
            t = tree()
            if find(t, identifier='meeting-next') is not None: break
            adb('shell', 'input', 'swipe', str(w // 2), str(int(h * .3)), str(w // 2), str(int(h * .8)), '400')
        t = tree(); go = find(t, identifier='meeting-next'); pause = find(t, description='Pause meeting')
        tap_node(go); time.sleep(1); tap_node(pause)
        t = tree(); assert 'PAUSED' in ET.tostring(t, encoding='unicode')
        # Welcome finishes early; reordered Morgan receives the spare time.
        tap_node(find(t, identifier='meeting-next')); tap_node(pause)
        t = tree(); current = find(t, identifier='current-speaker')
        assert current is not None and current.attrib.get('text') == 'Morgan', 'Handoff lost reordered speaker identity'
        capture(f'{form}-android-meeting-active.png')
        open_path('floating')
        tap_node(find(tree(), text='Open floating timer'))
        adb('shell', 'input', 'keyevent', 'KEYCODE_HOME'); time.sleep(1)
        t = tree(); assert find(t, text='Morgan') is not None, 'Floating window did not render over launcher'
        tap_node(find(t, text='Next')); time.sleep(1)
        t = tree(); assert find(t, text='Alex') is not None, 'Floating Next did not control the background meeting'
        tap_node(find(t, text='Pause')); t = tree(); assert find(t, text='Resume') is not None, 'Floating Pause did not update'
        tap_node(find(t, text='Undo')); t = tree(); assert find(t, text='Morgan') is not None, 'Floating Undo did not restore speaker'
        capture(f'{form}-android-floating.png')
        tap_node(find(t, text='Close'))
        open_path('')
        # Preserve ready-state regression captures for the other app surfaces.
        for path, suffix in [('timer/boxing', 'boxing'), ('edit/boxing', 'editor'), ('history', 'history')]:
            open_path(path); capture(f'{form}-android-{suffix}.png')
        open_path('settings'); tap_node(find(tree(), text='Dark'))
        adb('shell', 'settings', 'put', 'system', 'font_scale', '1.3')
        open_path(''); capture(f'{form}-android-dark-large-text.png')
        if form == 'tablet':
            adb('shell', 'wm', 'size', '1920x1200'); time.sleep(1); capture('tablet-android-landscape.png')
        adb('shell', 'settings', 'put', 'system', 'font_scale', '1.0')
        print(f'{form}: launch, actual drag reorder, early handoff and background overlay Next/Pause/Undo passed', flush=True)
except Exception:
    capture('native-flow-failed.png')
    try: (output / 'failure-ui.xml').write_text(ET.tostring(tree(), encoding='unicode'))
    except Exception: pass
    (output / 'native-crash.log').write_text(adb('logcat', '-d', '-s', 'AndroidRuntime', 'ReactNativeJS', 'ReactNative')[-18000:])
    raise
finally:
    adb('shell', 'settings', 'put', 'system', 'font_scale', '1.0')
