"""Additional destructive QA only on the disposable emulator used by CI."""
import json
import os
import re
import subprocess
import time


def verify(g, form):
    adb, tree, find, tap = (g[k] for k in ['adb', 'tree', 'find', 'tap_node'])
    open_path, scroll_text, capture, dimensions = (g[k] for k in ['open_path', 'scroll_text', 'capture', 'dimensions'])
    output = g['output']
    result = {'form': form, 'source': os.getenv('GITHUB_SHA'), 'feedbackSent': False,
              'physicalDevice': False, 'clockJump': {'tested': False}}

    def top(identifier):
        for _ in range(12):
            t = tree()
            node = find(t, identifier=identifier)
            if node is not None:
                return t
            w, h = dimensions()
            adb('shell', 'input', 'swipe', str(w // 2), str(int(h * .3)), str(w // 2), str(int(h * .8)), '400')
        raise AssertionError('Could not reach ' + identifier)

    def seconds(t):
        text = find(t, identifier='board-clock-0').attrib['text']
        minutes, seconds = text.split(':')
        return int(minutes) * 60 + int(seconds)

    open_path('specialty/multi-stopwatch')
    t = top('board-clock-0')
    tap(find(t, text='Reset'))
    tap(find(tree(), text='Start'))
    time.sleep(2)
    assert seconds(top('board-clock-0')) >= 1

    if form == 'phone':
        # A wall-clock jump while JS is stopped must not add an hour to elapsed
        # duration. Restore OS time even if the app/assertion fails.
        root = subprocess.run(['adb', 'root'], text=True, capture_output=True, timeout=35)
        adb('wait-for-device')
        permitted = 'cannot run as root' not in (root.stdout + root.stderr)
        if permitted:
            base = int(adb('shell', 'date', '+%s').strip())
            began = time.monotonic()
            previous_auto = adb('shell', 'settings', 'get', 'global', 'auto_time').strip()
            before = seconds(top('board-clock-0'))
            try:
                adb('shell', 'input', 'keyevent', 'KEYCODE_HOME')
                adb('shell', 'settings', 'put', 'global', 'auto_time', '0')
                changed = subprocess.run(['adb', 'shell', 'date', '-u', '@' + str(base + 3600)], text=True, capture_output=True, timeout=35)
                actual = int(adb('shell', 'date', '+%s').strip())
                if changed.returncode == 0 and actual - base >= 3590:
                    adb('shell', 'am', 'force-stop', 'com.corptimer.app')
                    open_path('specialty/multi-stopwatch')
                    for _ in range(15):
                        time.sleep(1)
                        t = tree()
                        if find(t, identifier='board-clock-0') is not None:
                            break
                    after = seconds(t)
                    assert 0 <= after - before < 120, 'Wall-clock correction or same-boot restart changed elapsed by an hour'
                    result['clockJump'] = {'tested': True, 'wallShiftSeconds': actual - base,
                                           'elapsedDeltaSeconds': after - before, 'processRestart': True}
                    capture('phone-041-monotonic-restart.png')
                else:
                    result['clockJump']['skipReason'] = 'Emulator clock could not be changed'
            finally:
                restore = base + int(time.monotonic() - began)
                adb('shell', 'date', '-u', '@' + str(restore))
                adb('shell', 'settings', 'put', 'global', 'auto_time', previous_auto if previous_auto in ['0', '1'] else '1')
        else:
            result['clockJump']['skipReason'] = 'Emulator does not allow root'

    t = top('board-clock-0')
    tap(find(t, text='Pause'))
    t, favorite = scroll_text('Add to favorites')
    tap(favorite)
    assert find(tree(), text='Remove favorite') is not None
    t, save = scroll_text('Save setup')
    tap(save)
    open_path('feedback')
    t, message = g['scroll_to']('feedback-message')
    tap(message)
    adb('shell', 'input', 'text', 'QA_DRAFT_DELETE_WITHOUT_SENDING')
    adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
    time.sleep(1)
    # Never press Send with this nonempty draft.
    open_path('settings')
    t, delete = scroll_text('Delete local timer data')
    tap(delete)
    confirm_tree = tree()
    tap(find(confirm_tree, text='Continue') or find(confirm_tree, text='CONTINUE'))
    time.sleep(2)
    open_path('specialty/multi-stopwatch')
    t = top('board-clock-0')
    assert seconds(t) == 0, 'Reset left the saved specialty elapsed time'
    t, _ = scroll_text('Add to favorites')
    assert find(t, text='Remove favorite') is None, 'Reset kept favorites'
    t, load = scroll_text('Load setup')
    tap(load)
    scroll_text('Save a setup first.')
    open_path('feedback')
    t, message = g['scroll_to']('feedback-message')
    assert message.attrib.get('text') != 'QA_DRAFT_DELETE_WITHOUT_SENDING', 'Reset kept the feedback draft'
    assert message.attrib.get('text', '') in ['', 'What happened? What did you expect?'], 'Feedback is not empty after reset'
    capture(form + '-041-data-reset.png')
    open_path('')
    assert find(g['scroll_top'](), identifier='meeting-remaining').attrib.get('text') == '5:00', 'Reset did not restore primary defaults'
    result['resetDomains'] = {'primary': True, 'board': True, 'setup': True, 'favorites': True, 'feedbackDraft': True}
    (output / (form + '-041-reliability.json')).write_text(json.dumps(result, indent=2))
    print(form + ': 0.4.1 reliability checks ' + json.dumps(result), flush=True)
