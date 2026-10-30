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
    # The floating timer is intentionally non-focusable. Include all windows,
    # otherwise Android reports only the focused launcher behind the overlay.
    adb('shell', 'uiautomator', 'dump', '--windows', '/sdcard/corptimer-ui.xml')
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

def scroll_text(text):
    for _ in range(12):
        t = tree(); node = find(t, text=text)
        if node is not None: return t, node
        swipe_up()
    raise AssertionError('Could not reach text ' + text)

def open_path(path):
    adb('shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', 'corptimer://' + path, 'com.corptimer.app'); time.sleep(1)

def scroll_top():
    w, h = dimensions()
    for _ in range(12):
        t = tree()
        if find(t, description='Meeting name') is not None: return t
        adb('shell', 'input', 'swipe', str(w // 2), str(int(h * .3)), str(w // 2), str(int(h * .8)), '400')
    raise AssertionError('Could not return to the meeting heading')

def planned_label(t, name):
    for node in t.iter('node'):
        label = node.attrib.get('content-desc', '')
        if label.startswith(name + ', ') and ' planned, ' in label:
            a, b, c, d = bounds(node)
            if c > a and d > b: return label
    raise AssertionError('Visible timeline label missing: ' + name)

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
        # This release checks server-backed trial/free access before editing.
        # Wait for the actual network result, never replace it with a UI fixture.
        for _ in range(20):
            if find(tree(), text='Full access · trial') is not None: break
            time.sleep(2)
        else: raise AssertionError('The release APK could not initialize real trial access')
        capture(f'{form}-android-meeting-ready.png')
        # A fresh install has one hour, five named people and a five-minute welcome.
        assert find(tree(), identifier='meeting-remaining').attrib.get('text') == '5:00'
        open_path('meeting-slot?id=welcome')
        t, ring = scroll_to('duration-dial')
        a, b, c, d = bounds(ring)
        w, h = dimensions()
        if d > h * .83:
            adb('shell', 'input', 'swipe', str(w // 2), str(int(h * .77)), str(w // 2), str(int(h * .48)), '500')
            t = tree(); ring = find(t, identifier='duration-dial'); a, b, c, d = bounds(ring)
        cx, cy = (a+c)//2, (b+d)//2
        radius = int((c-a)*.44)
        original = find(t, identifier='dial-value').attrib.get('text')
        # The actual native rim gesture, not a surrogate plus-button tap.
        adb('shell', 'input', 'swipe', str(cx), str(cy-radius), str(cx+radius), str(cy), '1600')
        t = tree(); rotated = find(t, identifier='dial-value').attrib.get('text')
        assert float(rotated) > float(original), 'Clockwise rotation did not add time'
        capture(f'{form}-android-duration-dial.png')
        adb('shell', 'input', 'swipe', str(cx+radius), str(cy), str(cx), str(cy-radius), '1600')
        t = tree(); assert float(find(t, identifier='dial-value').attrib.get('text')) < float(rotated), 'Counterclockwise rotation did not subtract time'
        tap_node(find(t, identifier='dial-value'))
        adb('shell', 'input', 'text', '7'); adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
        assert find(tree(), identifier='dial-value').attrib.get('text') == '7', 'Direct numeric entry failed'
        adb('shell', 'input', 'keyevent', 'KEYCODE_BACK'); open_path('')
        open_path('feedback')
        t = tree()
        assert find(t, identifier='feedback-message') is not None, 'Feedback opened outside the app'
        for _ in range(6):
            t = tree(); send = find(t, text='Send message')
            if send is not None: break
            swipe_up()
        tap_node(send)
        assert 'at least 10 characters' in ET.tostring(tree(), encoding='unicode'), 'Empty feedback lacked an actionable error'
        capture(f'{form}-android-feedback-validation.png')
        # No nonempty message is sent by the native regression harness.
        adb('shell', 'input', 'keyevent', 'KEYCODE_BACK'); open_path('')
        # Preserve intermediate decimal/empty input until the generic editor commits.
        open_path('edit/meeting')
        t = tree(); field = find(t, description='Duration · minutes')
        if field is None:
            swipe_up(); t = tree(); field = find(t, description='Duration · minutes')
        tap_node(field)
        adb('shell', 'input', 'keyevent', 'KEYCODE_DEL')
        assert find(tree(), description='Duration · minutes').attrib.get('text') == '', 'Clearing the duration immediately became zero'
        adb('shell', 'input', 'text', '2.')
        assert find(tree(), description='Duration · minutes').attrib.get('text') == '2.', 'Decimal intermediate was normalized away'
        adb('shell', 'input', 'text', '5'); adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
        tap_node(find(tree(), text='Done'))
        open_path('')
        assert find(scroll_top(), identifier='meeting-remaining').attrib.get('text') == '2:30', '2.5 minutes did not save as 150 seconds'
        open_path('meeting-options')
        t, _ = scroll_to('dial-value'); tap_node(find(t, identifier='dial-value'))
        adb('shell', 'input', 'text', '120'); adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
        t, save = scroll_text('Save settings'); tap_node(save)
        open_path(''); t, _ = scroll_to('drag-handle-1')
        assert find(t, text='120') is not None, 'Long total did not retain all digits'
        capture(f'{form}-android-total-long.png')
        # The rest of the required matrix uses the untouched one-hour starter.
        adb('shell', 'pm', 'clear', 'com.corptimer.app')
        adb('shell', 'appops', 'set', 'com.corptimer.app', 'SYSTEM_ALERT_WINDOW', 'allow')
        launch()
        for _ in range(20):
            if find(tree(), text='Full access · trial') is not None: break
            time.sleep(2)
        else: raise AssertionError('Trial access did not initialize after emulator reset')
        # A horizontal resize handle must yield vertical motion to the page,
        # and still change planned budgets when dragged horizontally.
        t, boundary = scroll_to('boundary-1')
        w, h = dimensions(); x, y = center(boundary)
        adb('shell', 'input', 'swipe', str(x), str(y), str(x), str(y - int(h * .14)), '700')
        t = tree(); boundary = find(t, identifier='boundary-1')
        assert boundary is not None and center(boundary)[1] < y - 20, 'Timeline handle swallowed vertical scrolling'
        before = (planned_label(t, 'Welcome'), planned_label(t, 'Alex'))
        x, y = center(boundary)
        adb('shell', 'input', 'swipe', str(x), str(y), str(x + int(w * .12)), str(y), '1000'); time.sleep(.5)
        t = tree()
        assert (planned_label(t, 'Welcome'), planned_label(t, 'Alex')) != before, 'Horizontal boundary did not change the plan'
        # Restore the unmodified starter for the rest of the screenshot matrix.
        tap_node(find(scroll_top(), text='New meeting'))
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
        t = scroll_top(); go = find(t, identifier='meeting-next'); pause = find(t, description='Pause meeting')
        tap_node(go); time.sleep(1); tap_node(pause)
        t = tree(); assert find(t, description='Resume meeting') is not None, 'Pause did not expose Resume'
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
        print(f'{form}: launch, perpendicular timeline scroll, horizontal boundary edit, actual drag reorder, early handoff and background overlay Next/Pause/Undo passed', flush=True)
except Exception:
    capture('native-flow-failed.png')
    try: (output / 'failure-ui.xml').write_text(ET.tostring(tree(), encoding='unicode'))
    except Exception: pass
    (output / 'native-crash.log').write_text(adb('logcat', '-d', '-s', 'AndroidRuntime', 'ReactNativeJS', 'ReactNative')[-18000:])
    raise
finally:
    adb('shell', 'settings', 'put', 'system', 'font_scale', '1.0')
