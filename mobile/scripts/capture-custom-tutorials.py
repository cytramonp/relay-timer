"""Actual custom-timer creation on a disposable CI emulator; never bypass billing.
Uses the accessibility/ADB approach of verify-meeting-android.py without importing
its destructive top-level test matrix. Recordings and subtitles use observed times.
"""
from pathlib import Path
import hashlib, json, os, re, subprocess, time
import xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "custom-tutorials"
OUT.mkdir(exist_ok=True)
APP = "com.corptimer.app"

def adb(*args):
    return subprocess.check_output(["adb", *args], text=True, timeout=40)

assert os.environ.get("CI") == "true" and adb("get-serialno").strip().startswith("emulator-"), "Disposable CI emulator only"
apks = list((ROOT / "android/app/build/outputs/apk/release").glob("*.apk"))
assert len(apks) == 1, "Expected one exact APK"
apk = apks[0]
recipes = json.loads((OUT / "recipes.json").read_text())
report = {"apkRunId": os.environ["APK_RUN_ID"], "scriptRevision": os.environ["GITHUB_SHA"],
          "apkSha256": hashlib.sha256(apk.read_bytes()).hexdigest(), "status": "running", "recipes": [],
          "scope": "Real API36 emulator UI and real trial entitlement; recipe creation, editing, save/load, fullscreen and restart persistence. No purchases, feedback, billing bypass, or real-device claims."}

def tree():
    for _ in range(3):
        r = subprocess.run(["adb", "shell", "uiautomator", "dump", "--windows", "/sdcard/custom-ui.xml"], capture_output=True, text=True, timeout=35)
        if r.returncode == 0 and "ERROR" not in r.stdout:
            return ET.fromstring(adb("shell", "cat", "/sdcard/custom-ui.xml"))
    raise AssertionError("Fresh accessibility snapshot unavailable")

def bounds(n):
    return tuple(map(int, re.findall(r"\d+", n.attrib.get("bounds", "[0,0][0,0]"))))

def find(t, text=None, desc=None, ident=None):
    for n in t.iter("node"):
        a = n.attrib
        if text is not None and a.get("text") != text: continue
        if desc is not None and a.get("content-desc") != desc: continue
        if ident is not None and not a.get("resource-id", "").endswith(ident): continue
        l, top, r, b = bounds(n)
        if r > l and b > top: return n
    return None

def tap(n):
    assert n is not None, "Required visible control absent"
    l, t, r, b = bounds(n)
    adb("shell", "input", "tap", str((l+r)//2), str((t+b)//2)); time.sleep(.6)

def dims():
    return tuple(map(int, re.findall(r"(\d+)x(\d+)", adb("shell", "wm", "size"))[-1]))

def scroll(down=True):
    w, h = dims(); y1, y2 = (.75, .34) if down else (.30, .80)
    adb("shell", "input", "swipe", str(w//2), str(int(h*y1)), str(w//2), str(int(h*y2)), "300"); time.sleep(.25)

def seek(**kw):
    for _ in range(65):
        t = tree(); n = find(t, **kw)
        if n is not None and bounds(n)[3] < dims()[1] - 80: return n
        scroll()
    raise AssertionError("Could not reach " + str(kw))

def ensure_editor():
    top()
    t = tree()
    if find(t, text="Close editor") is None:
        tap(find(t, ident="customize-timer"))
    top()
def top():
    for _ in range(35):
        if find(tree(), ident="customize-timer") is not None: return
        scroll(False)
    raise AssertionError("Could not return to custom heading")

def open_path(path):
    adb("shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", "corptimer://" + path, APP); time.sleep(1)

def shot(name):
    with (OUT / (name + ".png")).open("wb") as f:
        subprocess.run(["adb", "exec-out", "screencap", "-p"], stdout=f, check=True, timeout=20)

def replace(n, value):
    old = n.attrib.get("text", "")
    tap(n); adb("shell", "input", "keyevent", "KEYCODE_MOVE_END")
    adb("shell", "input", "keyevent", *(["KEYCODE_DEL"] * (len(old)+2)))
    adb("shell", "input", "text", value.replace(" ", "%s"))
    adb("shell", "input", "keyevent", "KEYCODE_BACK"); time.sleep(.4)

def srt_time(v):
    ms = round(v*1000); return f"{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}"

class Recording:
    def __init__(self, name):
        self.name, self.events = name, []
        w, h = dims(); height = min(1920, int(h*720/w)//2*2)
        self.started = time.monotonic()
        self.proc = subprocess.Popen(["adb", "shell", "screenrecord", "--size", f"720x{height}", "--time-limit", "180", f"/sdcard/{name}.mp4"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(1)
    def caption(self, text): self.events.append((time.monotonic()-self.started, text))
    def finish(self):
        elapsed = time.monotonic()-self.started
        if self.proc.poll() is None:
            adb("shell", "pkill", "-2", "screenrecord")
            self.proc.wait(timeout=20)
        adb("pull", f"/sdcard/{self.name}.mp4", str(OUT / f"{self.name}-raw.mp4"))
        duration = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(OUT/f"{self.name}-raw.mp4")], text=True))
        assert elapsed < 178 and duration >= elapsed-4, "Recording ended before the demonstrated workflow"
        entries = []
        for i, (start, label) in enumerate(self.events):
            end = min(duration, self.events[i+1][0] if i+1 < len(self.events) else duration)
            if end > start: entries.append(f"{i+1}\n{srt_time(start)} --> {srt_time(end)}\n{label}\n")
        (OUT/f"{self.name}.srt").write_text("\n".join(entries), encoding="utf-8")
        subprocess.run(["ffmpeg", "-y", "-i", f"{self.name}-raw.mp4", "-vf", f"subtitles={self.name}.srt:force_style='FontSize=20,Outline=2,MarginV=32'", "-c:v", "libx264", "-crf", "20", "-an", f"{self.name}-captioned.mp4"], cwd=OUT, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return {"duration": duration, "captions": self.events}

recording = None
try:
    adb("install", "-r", str(apk)); adb("shell", "pm", "clear", APP)
    open_path("pro")
    for _ in range(25):
        if "YOUR PLAN" in ET.tostring(tree(), encoding="unicode") and "TRIAL" in ET.tostring(tree(), encoding="unicode"): break
        time.sleep(2)
    else: raise AssertionError("Real trial entitlement did not initialize")
    shot("00-real-trial")
    for recipe in recipes:
        rid, title = recipe["id"], recipe["title"]
        open_path("specialty/custom-timer"); top()
        if rid in ["boxing", "egg"]:
            recording = Recording(rid + "-create")
            recording.caption("Open Custom timer, then choose a recipe.")
        toggle = seek(ident="custom-recipes-toggle")
        if toggle.attrib.get("content-desc") != "Hide recipes": tap(toggle)
        if recording: recording.caption("Choose a complete recipe as your editable starting point.")
        tap(seek(ident="custom-recipe-"+rid)); time.sleep(1)
        assert find(tree(), ident="customize-timer") is not None, "Saved recipe did not open"
        tap(seek(text=title)); shot(rid+"-created")
        if recording: recording.caption("Your named timer is saved separately. Open Customize timer to edit its stages.")
        ensure_editor()
        name = seek(desc="Clock name")
        assert name.attrib.get("text") == title, "Wrong saved recipe name"
        stage = seek(desc="Stage 1 name")
        assert stage.attrib.get("text") == recipe["stages"][0]["name"], "Wrong first stage"
        seconds = seek(desc="Stage 1 \u00b7 seconds")
        assert float(seconds.attrib.get("text", "nan")) == recipe["stages"][0]["seconds"], "Wrong first duration"
        shot(rid+"-editor")
        if rid == "egg":
            replace(seconds, "421")
            tap(seek(text="Apply clock changes"))
            seek(text="Clock updated.")
            if recording: recording.caption("Change a stage duration, then Apply clock changes.")
        if recording: recording.caption("Each stage has a name, duration and sound. These values are editable.")
        # Close the editor before saving; no skipped or synthetic write to app storage.
        top(); tap(seek(text="Close editor"))
        tap(seek(ident="save-board-setup")); top(); seek(text="Setup saved on this device.")
        tap(seek(ident="load-board-setup")); top()
        if rid == "egg":
            ensure_editor()
            restored = seek(desc="Stage 1 \u00b7 seconds")
            assert restored.attrib.get("text") == "421", "Saved custom duration did not survive load"
            top(); tap(seek(text="Close editor"))
        if recording: recording.caption("Save setup keeps a reusable starting plan. Load setup restores it.")
        tap(seek(text="Full screen")); shot(rid+"-fullscreen")
        if recording: recording.caption("Use Full screen for an uncluttered timer. Exit to return to editing.")
        tap(seek(text="Exit full screen"))
        result = {"id": rid, "title": title, "create": "pass", "firstStageAndDuration": "pass", "saveLoad": "pass", "fullscreen": "pass"}
        if recording:
            result["video"] = recording.finish(); recording = None
        report["recipes"].append(result)
    # Verify saved data survives a process restart, using Library's actual search UI.
    adb("shell", "am", "force-stop", APP); open_path("programs")
    for recipe in recipes:
        open_path("programs")
        for _ in range(20):
            field = find(tree(), desc="Find a program")
            if field is not None: break
            scroll(False)
        assert field is not None, "Library search unavailable"
        replace(field, recipe["title"].split(" ")[0])
        seek(text=recipe["title"])
        shot(recipe["id"]+"-library-after-restart")
    report["restartPersistence"] = "pass"
    # Exercise the real Android DocumentsUI, using only synthetic local media.
    adb("push", str(ROOT/"assets/icon.png"), "/sdcard/Download/corptimer-demo-logo.png")
    adb("push", str(ROOT/"assets/beep.wav"), "/sdcard/Download/corptimer-demo-sound.wav")
    open_path("specialty/custom-timer"); top()
    brand = seek(ident="timer-brand-options")
    if brand.attrib.get("content-desc") != "Hide colors, logo & sounds": tap(brand)
    def pick_file(button, filename):
        tap(seek(text=button)); time.sleep(1)
        t = tree(); file = find(t, text=filename)
        if file is None:
            roots = find(t, desc="Show roots")
            assert roots is not None, "DocumentsUI navigation missing"
            tap(roots); tap(seek(text="Downloads")); file = seek(text=filename)
        tap(file); time.sleep(1)
    pick_file("Upload company logo", "corptimer-demo-logo.png")
    top(); seek(desc="corptimer-demo-logo.png")
    shot("media-logo-picked")
    pick_file("Upload sound", "corptimer-demo-sound.wav")
    top(); seek(text="corptimer-demo-sound.wav"); shot("media-sound-picked")
    tap(seek(text="Preview my sound"))
    report["mediaPicker"] = "passed image and WAV selection; preview invoked, audible output not measured"

    report["status"] = "passed"
except Exception as error:
    report["status"], report["error"] = "failed", str(error)
    try: shot("failure")
    except Exception: pass
    raise
finally:
    if recording and recording.proc.poll() is None:
        subprocess.run(["adb", "shell", "pkill", "-2", "screenrecord"], capture_output=True)
    report["files"] = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.glob("*") if p.is_file() and p.name != "provenance.json"}
    (OUT/"provenance.json").write_text(json.dumps(report, indent=2)+"\n", encoding="utf-8")
