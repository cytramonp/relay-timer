import {stageTick} from './transition-sound.js';
import {elapsedTime,deadline,splitMinutes,formatTime,normalizeState,equalizedAgenda} from "./model.js?v=8";
import {iconMarkup} from "./icons.js?v=8";
import {copyPlan,advanceAutomatic,makeReport,cleanParking} from './session.js?v=8';

// CorpTimer: milestone-anchored speaker slots with time rollover.
(function(){
  const KEY = "relay.timer.workspace.v4", OLD_KEY = "relay-timer-v3";
  const NAMES = ["Alex","Morgan","Jordan","Sam","Taylor","Casey","Robin"];
  let uid = 0;
  const mkId = () => "s" + Date.now().toString(36) + (uid++).toString(36);
  const mk = (name, min, kind) => ({ id: mkId(), kind: kind || "person", name, min });
  const defaults = () => ({ agenda: [mk('Welcome',3,'topic'),...NAMES.slice(0,5).map(n=>mk(n,3)),mk('Blockers',10,'topic'),mk('Wrap-up',2,'topic')],total:30, floor: 1, warn: 1, sound: false, autoSplit: true, keepProp: true, clock: 70, shape: "wide", endPolicy:'manual',parking:[],reports:[],run: null });
  let S = load();
  S.agenda.forEach(a => { if (!a.id) a.id = mkId(); if (!a.kind) a.kind = "person"; });
  if (!(S.total > 0)) S.total = round2(S.agenda.reduce((s, a) => s + (+a.min || 0), 0));
  function load(){
    try {
      const raw = localStorage.getItem(KEY);
      if (raw){ const o = JSON.parse(raw); if (o && Array.isArray(o.agenda)) return Object.assign(defaults(), o); }
      const old = localStorage.getItem(OLD_KEY);
      if (old){
        const o = JSON.parse(old);
        if (o && Array.isArray(o.agenda)) return Object.assign(defaults(), {
          agenda: o.agenda.map(a => mk(a.name, a.min)),
          floor: o.floor != null ? o.floor : 3, warn: o.warn != null ? o.warn : 1, sound: o.sound !== false });
      }
    } catch(e){}
    return defaults();
  }
  function save(){
    if(S.run){const plan=copyPlan(S.agenda),last=S.run.planChanges?.at(-1)?.plan||S.run.originalPlan;if(last&&JSON.stringify(plan)!==JSON.stringify(last)){S.run.planChanges||=[];S.run.planChanges.push({at:elapsed(),plan});}}
    if (!S.autoSplit) S.total = round2(total() / MIN);
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){ document.dispatchEvent(new CustomEvent("relay:storage-error")); }
    document.dispatchEvent(new CustomEvent("relay:change"));
  }

  // Overlay nodes are cached once: after they move into the floating window, document.getElementById no longer finds them.
  const cache = {};
  const $ = id => cache[id] || document.getElementById(id);
  ["ov","ovPos","ovSlotInfo","ovName","ovTime","ovBar","ovBlocks","ovNext","ovGo","ovPause"].forEach(id => cache[id] = document.getElementById(id));
  const MIN = 60000;
  const N = () => S.agenda.length;
  function round2(v){ return Math.round(v * 100) / 100; }

  // ---- time model ----
  function elapsed(){return elapsedTime(S.run);}
  const byId = id => S.agenda.find(a => a.id === id);
  const posOf = id => S.agenda.findIndex(a => a.id === id);
  function slotMs(sp){ return Math.max(0, (+sp.min || 0)) * MIN; }
  function cumThrough(id){ let s = 0; for (const a of S.agenda){ s += slotMs(a); if (a.id === id) break; } return s; }
  function total(){ return S.agenda.reduce((s, a) => s + slotMs(a), 0); }
  function floorMs(){ return Math.max(0, +S.floor || 0) * MIN; }
  function deadlineFor(id, startedAt){return deadline(S.agenda,id,startedAt,S.floor);}
  function spoken(id){ return !!S.run && S.run.log.some(l => l.id === id); }
  function isCur(id){ return !!(S.run && S.run.cur && S.run.cur.id === id); }
  function pending(){ return S.agenda.filter(a => !spoken(a.id) && !isCur(a.id)); }
  function isDone(){ return !!(S.run && !S.run.cur); }
  // Spoken slots are frozen only while the meeting runs; once it is finished the plan is the next meeting's, all editable.
  const isPast = a => !isDone() && spoken(a.id) && !isCur(a.id);

  function fmt(ms,mode){return formatTime(ms,mode);}
  function signed(ms){ const s = Math.round(ms/1000)*1000; return (s > 0 ? "+" : s < 0 ? "−" : "±") + fmt(Math.abs(s), "up"); }

  // ---- slot allocation ----
  // Splits targetMin across items by weight in 15-second steps; largest remainder keeps the sum exact.
  function splitInto(items,targetMin,weights){const values=splitMinutes(targetMin,weights);items.forEach((item,i)=>item.min=values[i]);}
  // Equal split: people who have not spoken and were not set by hand share whatever topics and fixed slots leave.
  function rebalance(){
    if (!S.autoSplit) return;
    const free = S.agenda.filter(a => a.kind !== "topic" && !a.pin && !isPast(a));
    if (!free.length) return;
    const locked = S.agenda.filter(a => !free.includes(a)).reduce((s, a) => s + (+a.min || 0), 0);
    splitInto(free, (+S.total || 0) - locked, free.map(() => 1));
  }
  // Without equal split, a new total scales every unspoken slot in proportion to the split when editing began.
  function rescaleTo(totalMin, base){
    const free = S.agenda.filter(a => !isPast(a));
    if (!free.length) return;
    const locked = S.agenda.filter(isPast).reduce((s, a) => s + (+a.min || 0), 0);
    splitInto(free, totalMin - locked, free.map(a => Math.max(0, +(base[a.id] != null ? base[a.id] : a.min) || 0)));
  }

  // ---- sound ----
  let ac = null;
  function initAudio(){ try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch(e){} }
  function beep(times){
    if (!S.sound || !ac) return;
    for (let k = 0; k < times; k++){
      const t = ac.currentTime + k*0.22, o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = times > 1 ? 660 : 880; o.type = "sine";
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t+0.02); g.gain.exponentialRampToValueAtTime(0.0001, t+0.18);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t+0.2);
    }
  }
  let beepMark = { key:"", warned:false, over:false };
  const resetBeeps = () => { beepMark = { key:"", warned:false, over:false }; };

  // ---- actions ----
  function closeCur(e){
    const r = S.run, c = r.cur;
    r.log.push({ id: c.id, start: c.start, end: e, dl: deadlineFor(c.id, c.start) });
    r.cur = null;
  }
  function next(){
    initAudio();if(S.run)stageTick();
    const r = S.run;
    if (!r){
      const p = pending(); if (!p.length) return;
      S.run = { id:crypto.randomUUID(),t0: Date.now(), pausedMs: 0, pauseAt: null, log: [], cur: { id: p[0].id, start: 0 },originalPlan:copyPlan(S.agenda),planChanges:[] };
    } else if (!isDone()){
      if (r.pauseAt != null) togglePause();
      const e = elapsed();
      closeCur(e);
      const p = pending();
      if (p.length) r.cur = { id: p[0].id, start: e }; else r.doneAt = e;
    }
    save(); renderRos(); tick();
  }
  function back(){
    const r = S.run; if (!r || !r.log.length) return;
    const l = r.log.pop(); r.cur = { id: l.id, start: l.start }; delete r.doneAt;
    resetBeeps(); save(); renderRos(); tick();
  }
  function togglePause(){
    const r = S.run; if (!r || isDone()) return;
    if (r.pauseAt == null) r.pauseAt = Date.now(); else { r.pausedMs += Date.now() - r.pauseAt; r.pauseAt = null; }
    save(); tick();
  }
  let resetArmed = null;
  function archiveRun(){if(!S.run)return;S.reports||=[];const report=makeReport(S);S.reports=S.reports.filter(r=>r.id!==report.id);S.reports.push(report);}
  function reset(){
    const b = $("btnReset");
    if (!resetArmed){ b.textContent = "Click again to reset"; resetArmed = setTimeout(() => { resetArmed = null; b.textContent = "Reset"; }, 3000); return; }
    clearTimeout(resetArmed); resetArmed = null; b.textContent = "Reset";
    archiveRun(); S.run = null; resetBeeps(); save(); renderRos(); tick();
  }
  function extendCurrent(){if(!S.run?.cur)return;const a=byId(S.run.cur.id);a.min=round2(a.min+1);a.pin=true;S.total=round2(total()/MIN);resetBeeps();save();renderRos();tick();}
  function addItem(kind){
    if (kind === "topic"){
      // A topic goes right after whoever is speaking, or to the top before the meeting starts.
      const at = S.run && S.run.cur ? posOf(S.run.cur.id) + 1 : S.run ? N() : 0;
      S.agenda.splice(at, 0, mk("Discussion", 20, "topic"));
    } else {
      S.agenda.push(mk("Speaker " + (S.agenda.filter(a => a.kind !== "topic").length + 1), 8));
    }
    rebalance(); save(); renderRos(); tick();
  }

  // ---- meeting clock correction: shifting t0 moves "now" without touching any recorded segment ----
  function setElapsed(v){
    const r = S.run; if (!r || isDone()) return;
    v = Math.max(r.cur ? r.cur.start : 0, v);
    const ref = r.pauseAt != null ? r.pauseAt : Date.now();
    r.t0 = ref - r.pausedMs - v;
    resetBeeps();
  }
  function nudgeClock(ms){ if (!S.run || isDone()) return; setElapsed(elapsed() + ms); save(); tick(); }

  // ---- run of show (rebuilt only on structure changes, so inputs keep focus) ----
  const rowEl = id => $("ros").querySelector('[data-id="' + id + '"]');
  function renderRos(){
    if (drag) endDrag();
    const box = $("ros"); box.innerHTML = "";
    S.agenda.forEach(sp => {
      const row = document.createElement("div");
      const topic = sp.kind === "topic";
      row.className = "row" + (topic ? " topic" : ""); row.dataset.id = sp.id;
      row.innerHTML =
        '<button type="button" class="grip" title="Drag to reorder, or focus and use arrow up and down" aria-label="Reorder ' + esc(sp.name) + '">' + iconMarkup('grip') + '</button>' +
        '<span class="n"></span>' +
        '<input type="text" class="nm" aria-label="' + (topic ? "Topic" : "Speaker name") + '" placeholder="' + (topic ? "Topic" : "Name") + '">' +
        '<span class="mnw"><input type="number" class="mn" min="0" max="240" step="0.25" aria-label="Minutes for ' + esc(sp.name) + '">' +
        '<button type="button" class="unpin" title="Back to the equal split" aria-label="Put ' + esc(sp.name) + ' back into the equal split" hidden>' + iconMarkup('reset') + '</button></span>' +
        '<span class="st"></span>' +
        '<button type="button" class="x" aria-label="Remove ' + esc(sp.name) + '">' + iconMarkup('close') + '</button>';
      const nm = row.querySelector(".nm"), mn = row.querySelector(".mn");
      nm.value = sp.name; mn.value = sp.min;
      nm.addEventListener("input", () => { sp.name = nm.value; mn.setAttribute("aria-label", "Minutes for " + sp.name); row.querySelector(".grip").setAttribute("aria-label", "Reorder " + sp.name); row.querySelector(".x").setAttribute("aria-label", "Remove " + sp.name); row.querySelector(".unpin").setAttribute("aria-label", "Put " + sp.name + " back into the equal split"); save(); tick(); });
      // With Keep proportions on, a typed value is spread over everyone still to speak, against the sizes at focus,
      // so each keystroke recomputes from the same starting point instead of compounding the rounding.
      let mnBase = null;
      mn.addEventListener("focus", () => { mnBase = snapMins(); });
      mn.addEventListener("blur", () => { mnBase = null; tick(); });
      mn.addEventListener("input", () => {
        const v = Math.max(0, parseFloat(mn.value) || 0);
        if (S.keepProp && !isPast(sp)){
          const absorb = S.agenda.filter(a => a !== sp && !isPast(a));
          if (applyKeep(sp, v, absorb, mnBase || (mnBase = snapMins()))){ pinEdited(sp, absorb, true); save(); tick(); return; }
        }
        sp.min = v;
        if (S.autoSplit && !topic) sp.pin = true;
        rebalance(); save(); tick();
      });
      row.querySelector(".unpin").addEventListener("click", () => { delete sp.pin; rebalance(); save(); tick(); });
      row.querySelector(".x").addEventListener("click", () => {
        if (spoken(sp.id) || isCur(sp.id)) return;
        if(S.agenda.length===1)return; S.agenda.splice(posOf(sp.id), 1); rebalance(); save(); renderRos(); tick();
      });
      row.querySelector(".grip").addEventListener("keydown", ev => {
        if (ev.key === "ArrowUp" || ev.key === "ArrowDown"){
          ev.preventDefault(); ev.stopPropagation();
          const to = posOf(sp.id) + (ev.key === "ArrowUp" ? -1 : 1);
          if (to < 0 || to >= N()) return;
          moveTo(sp.id, to); save(); renderRos(); tick();
          rowEl(sp.id).querySelector(".grip").focus();
        } else if (ev.code === "Space"){ ev.stopPropagation(); }
      });
      row.addEventListener("pointerdown", onRowDown);
      box.appendChild(row);
    });
  }

  // ---- reordering: mouse drags the whole row, touch drags the ⠿ handle; any item can go anywhere ----
  let drag = null;
  function moveTo(id, to){ const from = posOf(id); if (from < 0 || from === to) return; const [sp] = S.agenda.splice(from, 1); S.agenda.splice(to, 0, sp); }
  function onRowDown(ev){
    if (ev.button > 0 || drag) return;
    const row = ev.currentTarget, onGrip = !!ev.target.closest(".grip");
    if (!onGrip && (ev.pointerType !== "mouse" || ev.target.closest("input,button"))) return;
    ev.preventDefault();
    // Listen on window, not via pointer capture: moving the row in the DOM drops the capture after the first step.
    drag = { row, id: row.dataset.id, y0: ev.clientY, on: false };
    window.addEventListener("pointermove", dragMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  }
  function dragMove(e){
    const d = drag; if (!d) return;
    if (!d.on){
      if (Math.abs(e.clientY - d.y0) < 4) return;
      d.on = true; d.row.classList.add("dragging"); document.body.classList.add("dragging-any");
    }
    const box = $("ros"), others = [...box.children].filter(el => el !== d.row);
    let t = 0; others.forEach(el => { const b = el.getBoundingClientRect(); if (b.top + b.height/2 < e.clientY) t++; });
    if (t !== [...box.children].indexOf(d.row)){
      box.insertBefore(d.row, others[t] || null);
      moveTo(d.id, t); tick();   // milestones and slots follow the drag live
    }
  }
  function endDrag(){
    const d = drag; drag = null; if (!d) return;
    window.removeEventListener("pointermove", dragMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
    d.row.classList.remove("dragging"); document.body.classList.remove("dragging-any");
    if (d.on){ save(); tick(); }
  }

  // ---- render loop ----
  function blocksData(e){
    const r = S.run;
    return S.agenda.map(a => {
      const cur = isCur(a.id) && !isDone(), past = !cur && spoken(a.id);
      let frac = 0;
      if (cur){ const b = deadlineFor(a.id, r.cur.start) - r.cur.start; frac = b > 0 ? Math.min(1, (e - r.cur.start) / b) : 1; }
      return { w: Math.max(slotMs(a), 0.5 * MIN), st: cur ? "cur" : past ? "past" : "up", frac };
    });
  }
  let view = { state: "idle", pos: "", slotInfo: "", name: "", bar: 0, over: false, time: "", nextName: "", nextNote: "", blocks: [] };
  function tick(){
    if(advanceAutomatic(S)){stageTick();beep(2);save();renderRos();}
    const r = S.run, e = elapsed(), n = N(), p = pending();
    const ov = $("ov");
    $("clk").textContent = fmt(e, "up");
    $("clkTotal").textContent = fmt(total(), "up");
    const topics = S.agenda.filter(a => a.kind === "topic").length;
    $("rosCount").textContent = (n - topics) + " people" + (topics ? " · " + topics + (topics > 1 ? " topics" : " topic") : "");
    const tm = $("totalMin"); if (document.activeElement !== tm) tm.value = S.autoSplit ? S.total : round2(total() / MIN);
    const over = S.autoSplit ? total() / MIN - (+S.total || 0) : 0;
    $("rosWarn").hidden = !(over > 0.01);
    if (over > 0.01) $("rosWarn").textContent = "Topics and fixed slots add up to " + fmt(total(), "up") + ", more than the " + S.total + "-minute total.";

    let state = "idle", name = "–", time = fmt(n ? slotMs(S.agenda[0]) : 0), pos = "READY", slotInfo = "", nextName = "", nextNote = "", bar = 0;
    if (!r){
      name = n ? S.agenda[0].name : "Add a speaker";
      slotInfo = n ? "slot " + fmt(slotMs(S.agenda[0]), "up") : "";
      if (n > 1){ nextName = S.agenda[1].name; nextNote = "gets " + fmt(slotMs(S.agenda[1]), "up"); }
    } else if (isDone()){
      state = "done"; pos = "DONE"; name = "Meeting finished";
      time = fmt(r.doneAt, "up"); slotInfo = "plan " + fmt(total(), "up");
      const d = r.doneAt - total(); nextNote = d > 0 ? signed(d) + " over plan" : fmt(-d, "up") + " under plan";
    } else {
      const c = r.cur, st = c.start, dl = deadlineFor(c.id, st), budget = dl - st, rem = dl - e;
      const sp = byId(c.id) || { name: "", min: 0 }, bonus = budget - slotMs(sp);
      const doneCount = new Set(r.log.filter(l => l.id !== c.id).map(l => l.id)).size;
      pos = "NOW " + (doneCount + 1) + "/" + n + (sp.kind === "topic" ? " · TOPIC" : "") + (r.pauseAt != null ? " · PAUSED" : "");
      name = sp.name || "Speaker " + (posOf(c.id) + 1);
      slotInfo = "slot " + fmt(budget, "up") + (Math.abs(bonus) >= 1000 ? " (" + signed(bonus) + ")" : "");
      if (rem >= 0){ time = fmt(rem); state = rem <= (+S.warn||0)*MIN ? "warn" : "ok"; }
      else { time = "+" + fmt(-rem, "up") + "<small>over</small>"; state = "over"; }
      bar = budget > 0 ? Math.min(1, (e - st) / budget) : 1;
      if (p.length){ nextName = p[0].name; nextNote = "gets " + fmt(deadlineFor(p[0].id, e) - e, "up") + " if you stop now"; }
      else nextNote = "Last one";
      // beeps
      const key = c.id + "@" + c.start;
      if (beepMark.key !== key) beepMark = { key, warned: rem <= (+S.warn||0)*MIN, over: rem < 0 };
      if (r.pauseAt == null){
        if (!beepMark.warned && rem <= (+S.warn||0)*MIN && rem > 0){ beepMark.warned = true; beep(1); }
        if (!beepMark.over && rem <= 0){ beepMark.over = true; beep(2); }
      }
    }
    const blocks = blocksData(e);
    view = { state, pos, slotInfo, name, bar, over: state === "over",
             time: time.replace(/<small>.*<\/small>/, ""), nextName, nextNote, blocks };
    drawCanvas(); syncMediaState();
    ov.dataset.state = state;
    ov.classList.toggle("paused", !!(r && r.pauseAt != null));
    $("ovPos").textContent = pos;
    $("ovSlotInfo").textContent = slotInfo;
    $("ovName").textContent = name;
    $("ovTime").innerHTML = time;
    $("ovNext").innerHTML = (nextName ? "Next: <b>" + esc(nextName) + "</b>" : esc(nextNote)) +
      (nextName && nextNote ? "<small>" + esc(nextNote) + "</small>" : "");
    $("ovBar").style.width = (bar*100).toFixed(1) + "%";
    $("ovBlocks").innerHTML = blocks.map(b => '<i class="' + b.st + '" style="flex-grow:' + (b.w / MIN).toFixed(2) +
      (b.st === "cur" ? ";--p:" + (b.frac * 100).toFixed(1) + "%" : "") + '"></i>').join("");

    const goLabel = !r ? "Start" :isDone() ? "Done" : (p.length ? "Next" : "Finish");
    $("ovGo").textContent = goLabel; $("ovGo").disabled = isDone() || !n;
    $("btnNext").textContent = !r ? "Start meeting" : isDone() ? "Meeting finished" : (p.length ? "Next speaker" : "Finish meeting");
    $("btnNext").disabled = isDone() || !n;
    $("btnBack").disabled = !r || !r.log.length;
    const pl = r && r.pauseAt != null ? "Resume" : "Pause";
    $("btnPause").textContent = pl; $("ovPause").textContent = pl;
    $("btnPause").disabled = $("ovPause").disabled = !r || isDone();
    $("clkMinus").disabled = $("clkPlus").disabled = !r || isDone();
    if($("extend-current"))$("extend-current").disabled=!r||isDone();
    if($("end-policy"))$("end-policy").value=S.endPolicy||'manual';

    // per-row status
    S.agenda.forEach((sp, i) => {
      const row = rowEl(sp.id); if (!row) return;
      const cur = isCur(sp.id), done = !cur && spoken(sp.id);
      row.classList.toggle("cur", cur); row.classList.toggle("done", done);
      row.querySelector(".n").textContent = i + 1;
      row.querySelector(".x").disabled = cur || done;
      row.querySelector(".unpin").hidden = !(S.autoSplit && sp.pin);
      const mn = row.querySelector(".mn"); if (document.activeElement !== mn && +mn.value !== sp.min) mn.value = sp.min;
      const el = row.querySelector(".st");
      if (done){
        const segs = r.log.filter(l => l.id === sp.id);
        const used = segs.reduce((s, l) => s + l.end - l.start, 0), d = segs.reduce((s, l) => s + l.end - l.dl, 0);
        el.innerHTML = fmt(used, "up") + '<span class="chip ' + (d > 0 ? "bad" : "ok") + '">' + signed(d) + '</span>';
      } else if (cur){
        el.innerHTML = fmt(e - r.cur.start, "up") + '<span class="chip live">live</span>';
      } else {
        // The next item's slot reflects "if the current one stops now"; later ones assume full use before them.
        const v = (r && !isDone() && p.length && p[0].id === sp.id) ? deadlineFor(sp.id, e) - e : slotMs(sp);
        el.textContent = fmt(Math.max(0, v), "up");
      }
    });
    $("track").dataset.state = state;
    renderTrack(e, blocks);
    document.dispatchEvent(new Event('relay:tick'));
  }

  let lastScale = 1, clockDrag = null;
  function renderTrack(e, blocks){
    const r = S.run, tot = total();
    let end = tot; if (r){ end = Math.max(end, e); if (r.doneAt != null) end = Math.max(end, r.doneAt); }
    const frozen = clockDrag || bndDrag, scale = frozen ? frozen.scale : (end || 1); lastScale = scale;
    const pct = v => (v/scale*100).toFixed(3) + "%";
    let plan = "", act = "", ticks = '<span style="left:0">0</span>', a = 0;
    S.agenda.forEach((sp, i) => {
      const b = a + slotMs(sp), bl = blocks[i] || { st: "up", frac: 0 };
      plan += '<div class="seg ' + bl.st + (sp.kind === "topic" ? " topic" : "") + '" style="left:' + pct(a) + ';width:' + pct(b-a) +
        (bl.st === "cur" ? ";--p:" + (bl.frac * 100).toFixed(1) + "%" : "") + '">' + esc(sp.name) +
        (bndDrag ? " · " + fmt(slotMs(sp), "up") : "") + '</div>';
      if (canResizeAfter(i)) plan += '<div class="bnd' + (i === N() - 1 ? " end" : "") + (bndDrag && bndDrag.i === i ? " on" : "") + '" data-i="' + i + '" style="left:' + pct(b) +
        '" title="Drag to resize ' + esc(sp.name) + '"></div>';
      ticks += '<span style="left:' + pct(b) + '">' + Math.round(b/MIN*10)/10 + '</span>';
      a = b;
    });
    if (r){
      r.log.forEach(l => {
        const nm = (byId(l.id) || {}).name;
        act += '<div class="seg ' + (l.end > l.dl ? "over" : "under") + '" style="left:' + pct(l.start) + ';width:' + pct(l.end - l.start) + '">' + esc(nm) + '</div>';
      });
      if (r.cur) act += '<div class="seg live" style="left:' + pct(r.cur.start) + ';width:' + pct(e - r.cur.start) + '">' + esc((byId(r.cur.id) || {}).name) + '</div>';
    }
    $("lanes").innerHTML = '<div class="lane plan">' + plan + '</div><div class="lane act">' + act + '</div><div class="ticks">' + ticks + '</div>';
    const nl = $("nowline");
    nl.hidden = !r || isDone();
    if (r) nl.style.left = pct(Math.min(e, scale));
  }
  // ---- resizing slots: dragging the line after a block, or typing its minutes ----
  // The total stays fixed. Keep proportions on: the other unspoken items absorb the change in proportion to
  // their size when the edit began, all of them, before and after the edited one. Off: dragging moves only the
  // right neighbour.
  let bndDrag = null;
  function canResizeAfter(i){
    if (isPast(S.agenda[i])) return false;
    return i < N() - 1 ? !isPast(S.agenda[i + 1]) : !!S.keepProp && S.agenda.some((a, k) => k !== i && !isPast(a));
  }
  function absorbersFor(i, keep){
    const items = S.agenda, it = items[i];
    if (!keep) return i < items.length - 1 && !isPast(items[i + 1]) ? [items[i + 1]] : [];
    const after = items.slice(i + 1).filter(a => !isPast(a));
    return after.length ? after : items.filter(a => a !== it && !isPast(a));
  }
  // Sets item `it` to `want` minutes and spreads the difference over `absorb`, weighted by `base`.
  function applyKeep(it, want, absorb, base){
    const STEP = 0.25;
    if (!absorb.length) return false;
    const pool = base[it.id] + absorb.reduce((s, a) => s + base[a.id], 0);
    const maxI = pool - STEP * absorb.length;
    if (maxI < STEP) return false;
    const v = Math.min(maxI, Math.max(STEP, Math.round(want / STEP) * STEP));
    it.min = v;
    splitInto(absorb, pool - v, absorb.map(a => base[a.id]));
    // Keep at least one 15-second step per absorbing slot, taken from the largest one.
    absorb.forEach(a => {
      if (a.min >= STEP) return;
      const big = absorb.reduce((m, x) => x.min > m.min ? x : m, absorb[0]);
      big.min -= STEP - a.min; a.min = STEP;
    });
    return true;
  }
  function pinEdited(it, absorb, keep){
    if (!S.autoSplit) return;
    if (it.kind !== "topic") it.pin = true;
    // Without proportions the neighbour's new size is deliberate too, so the equal split must not undo it.
    if (!keep) absorb.forEach(a => { if (a.kind !== "topic") a.pin = true; });
  }
  // Keep proportions on, a line between two blocks: the block the line moves toward grows (right: the one on the
  // left, left: the one on the right) and every other unspoken block shrinks in proportion, earlier ones included.
  // The new size is solved so the line lands under the pointer even though the blocks before it shrink too.
  function keepLine(i, L, L0, base){
    const items = S.agenda, live = items.filter(a => !isPast(a));
    const grow = L >= L0 ? items[i] : items[i + 1], absorb = live.filter(a => a !== grow);
    const pool = live.reduce((s, a) => s + base[a.id], 0), R = pool - base[grow.id];
    const P = items.slice(0, i + 1).filter(isPast).reduce((s, a) => s + base[a.id], 0);
    const before = items.slice(0, i + 1).filter(a => !isPast(a) && a !== grow).reduce((s, a) => s + base[a.id], 0);
    if (R <= 0) return;
    let v;
    if (grow === items[i]){ const after = R - before; if (after <= 0) return; v = (L - P - pool * before / R) / (after / R); }
    else { if (before <= 0) return; v = pool - (L - P) / before * R; }
    if (applyKeep(grow, v, absorb, base)) pinEdited(grow, absorb, true);
  }
  // Explicit equalization covers both speakers and topics, unlike the optional automatic people split.
  function equalize(){
    const tot = S.autoSplit ? (+S.total || 0) : total() / MIN;
    S.agenda=equalizedAgenda(S.agenda,S.run,tot);
    save(); renderRos(); tick();
  }
  const snapMins = () => { const b = {}; S.agenda.forEach(a => b[a.id] = +a.min || 0); return b; };
  const xToMin = x => { const b = $("lanes").getBoundingClientRect(); return (x - b.left) / b.width * lastScale / MIN; };
  $("lanes").addEventListener("pointerdown", ev => {
    const h = ev.target.closest(".bnd");
    if (!h || ev.button > 0 || bndDrag || clockDrag) return;
    ev.preventDefault(); ev.stopPropagation();
    const i = +h.dataset.i, it = S.agenda[i], keep = !!S.keepProp, absorb = absorbersFor(i, keep);
    // The pointer moves the line by the same distance it travels; the end of the last block cannot
    // follow the pointer literally because the total is fixed.
    const base = snapMins(), L0 = S.agenda.slice(0, i + 1).reduce((s, a) => s + base[a.id], 0);
    bndDrag = { i, keep, base, x0: xToMin(ev.clientX), scale: lastScale };
    document.body.classList.add("resizing-any");
    const move = e => {
      const d = bndDrag, dx = xToMin(e.clientX) - d.x0;
      if (keep && i < N() - 1) keepLine(i, L0 + dx, L0, d.base);
      else if (applyKeep(it, d.base[it.id] + dx, absorb, d.base)) pinEdited(it, absorb, keep);
      tick();
    };
    const up = () => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      document.body.classList.remove("resizing-any"); bndDrag = null; save(); tick();
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    tick();
  });

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

  // Dragging the marker freezes the track scale, otherwise the scale would chase the pointer.
  function clockFromX(x){ const b = $("lanes").getBoundingClientRect(); return Math.max(0, Math.min(1, (x - b.left) / b.width)) * clockDrag.scale; }
  $("nowline").addEventListener("pointerdown", ev => {
    if (!S.run || isDone() || ev.button > 0) return;
    ev.preventDefault();
    clockDrag = { scale: lastScale };
    const nl = $("nowline"); nl.classList.add("grabbed");
    try { nl.setPointerCapture(ev.pointerId); } catch(e){}
    const move = e => { setElapsed(clockFromX(e.clientX)); tick(); };
    const up = () => {
      nl.removeEventListener("pointermove", move); nl.removeEventListener("pointerup", up); nl.removeEventListener("pointercancel", up);
      nl.classList.remove("grabbed"); clockDrag = null; save(); tick();
    };
    nl.addEventListener("pointermove", move); nl.addEventListener("pointerup", up); nl.addEventListener("pointercancel", up);
  });
  $("knob").addEventListener("keydown", ev => {
    if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
    ev.preventDefault(); ev.stopPropagation();   // ArrowLeft is also the global "undo switch"
    nudgeClock((ev.key === "ArrowRight" ? 1 : -1) * (ev.shiftKey ? 60000 : 15000));
  });

  // ---- always-on-top window ----
  // Embedded pages (like this artifact frame) cannot open a Document PiP window, so there we fall back to
  // video Picture-in-Picture: the overlay is painted on a canvas and streamed into a muted <video>.
  // The canvas size sets the window's aspect ratio; the user resizes the window itself by its edges.
  // Chrome will not shrink a video floating window below about 260x146, keeping the video's aspect ratio,
  // so "wide" is 16:9 to reach exactly that floor. A Document PiP window (standalone page) can go much smaller.
  const SHAPES = { wide: [720, 405], strip: [900, 200], square: [560, 440] };
  const DOC_SIZES = { wide: [340, 200], strip: [420, 110], square: [300, 260] };
  const K = 1.5;   // canvas pixel density, so a window dragged bigger stays sharp
  const STANDALONE = new URL("./",location.href).href;
  let pipWin = null, vpip = null;
  const embedded = (() => { try { return window.self !== window.top; } catch(e){ return true; } })();
  async function floatOut(){
    const msg = $("floatMsg"); msg.hidden = true;
    if (pipWin){ pipWin.close(); return; }
    if (vpip){ try { await document.exitPictureInPicture(); } catch(e){ closeVideoPip(); } return; }
    if (!embedded && "documentPictureInPicture" in window){
      try { await docPip(); return; } catch(e){ /* fall back to video PiP */ }
    }
    try { await videoPip(); }
    catch(err){
      try { console.warn("[relay-timer] floating window failed:", err && err.name, err && err.message); } catch(e){}
      closeVideoPip();
      msg.textContent = "The browser refused the floating window (" + (err && err.name || "error") + "). Use Chrome or Edge, or open the standalone copy of this timer.";
      msg.hidden = false;
    }
  }

  async function videoPip(){
    if (!document.pictureInPictureEnabled) throw new DOMException("Picture-in-Picture is off in this browser", "NotSupportedError");
    try { await document.fonts.ready; } catch(e){}
    const c = document.createElement("canvas");
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.setAttribute("aria-hidden", "true");
    v.style.cssText = "position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0;pointer-events:none";
    document.body.appendChild(v);
    vpip = { c, ctx: c.getContext("2d"), v };
    drawCanvas();
    v.srcObject = c.captureStream(10);
    await v.play();
    await v.requestPictureInPicture();
    v.addEventListener("leavepictureinpicture", closeVideoPip, { once: true });
    setupMediaKeys();
    $("floatNote").querySelector("span").textContent = "Floating video timer is open. Media controls support next, undo and pause. Check its visibility in your screen share.";
    $("floatNote").hidden = false; $("btnFloat").textContent = "Close float";
  }
  function closeVideoPip(){
    if (!vpip) return;
    try { vpip.v.srcObject && vpip.v.srcObject.getTracks().forEach(t => t.stop()); } catch(e){}
    vpip.v.remove(); vpip = null;
    $("floatNote").hidden = true; $("btnFloat").textContent = "Float timer";
  }
  function setupMediaKeys(){
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession, set = (a, f) => { try { ms.setActionHandler(a, f); } catch(e){} };
    try { ms.metadata = new MediaMetadata({ title: "CorpTimer", artist: "Start/Pause ⏯  ·  Next ⏭  ·  Undo ⏮" }); } catch(e){}
    set("nexttrack", () => next());
    set("previoustrack", () => back());
    // Chrome may draw this centre button as "pause" because the stream itself is playing,
    // so either icon does the same thing: start the meeting, then pause and resume it.
    set("play", playPause);
    set("pause", playPause);
  }
  function playPause(){
    if (!S.run) next(); else if (!isDone()) togglePause();
    keepVideo();
  }
  // The PiP play/pause button must not freeze the stream; it only drives the meeting clock.
  function keepVideo(){ if (vpip && vpip.v.paused) vpip.v.play().catch(() => {}); }
  function syncMediaState(){
    if (!vpip || !("mediaSession" in navigator)) return;
    try { navigator.mediaSession.playbackState = (S.run && S.run.pauseAt == null && !isDone()) ? "playing" : "paused"; } catch(e){}
  }

  // Countdown size in the floating window, as a share of the largest that fits.
  const clk = () => Math.min(100, Math.max(20, +S.clock || 50)) / 100;
  function setClock(v){
    S.clock = Math.min(100, Math.max(20, Math.round(v / 5) * 5));
    $("ov").style.setProperty("--clk", clk());
    const c = document.getElementById("setClock"); if (c) c.value = S.clock;
    const l = document.getElementById("setClockVal"); if (l) l.textContent = S.clock + "%";
    save(); tick();
  }
  function fitFont(ctx, text, weight, family, maxPx, maxW){
    let px = Math.floor(maxPx); ctx.font = weight + " " + px + "px " + family;
    while (px > 10 && ctx.measureText(text).width > maxW){ px -= 2; ctx.font = weight + " " + px + "px " + family; }
    return px;
  }
  function drawCanvas(){
    if (!vpip) return;
    const shape = SHAPES[S.shape] ? S.shape : "wide", [W, H] = SHAPES[shape];
    const { c, ctx } = vpip;
    if (c.width !== W * K || c.height !== H * K){ c.width = W * K; c.height = H * K; }
    ctx.setTransform(K, 0, 0, K, 0, 0);
    const cs = getComputedStyle(document.documentElement), col = n => cs.getPropertyValue(n).trim();
    const g = { ctx, W, H, col,
      stateCol: { ok: col("--ov-ok"), warn: col("--ov-warn"), over: col("--ov-bad") }[view.state] || col("--ov-muted"),
      NUM: '"Martian Mono", Consolas, monospace', UI: '"Onest", "Segoe UI", system-ui, sans-serif' };
    ctx.fillStyle = col("--ov-bg"); ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = "alphabetic";
    if (shape === "strip") drawStrip(g); else drawStack(g);
  }
  function drawBlocks(g, x, y, w, h){
    const { ctx, col } = g, bl = view.blocks; if (!bl.length) return;
    const gap = Math.max(2, h * 0.3), sum = bl.reduce((s, b) => s + b.w, 0), avail = w - gap * (bl.length - 1);
    let cx = x;
    bl.forEach(b => {
      const bw = Math.max(4, avail * b.w / sum);
      if (b.st === "cur"){
        ctx.globalAlpha = 0.5; ctx.fillStyle = g.stateCol; ctx.fillRect(cx, y, bw, h);
        ctx.globalAlpha = 1; ctx.fillRect(cx, y, bw * b.frac, h);
      } else { ctx.fillStyle = col(b.st === "past" ? "--ov-past" : "--ov-up"); ctx.fillRect(cx, y, bw, h); }
      cx += bw + gap;
    });
  }
  function drawNext(g, x, y, w, px, withNote){
    const { ctx, col, UI } = g;
    ctx.textAlign = "left";
    if (!view.nextName){ ctx.fillStyle = col("--ov-muted"); fitFont(ctx, view.nextNote, "600", UI, px * 0.8, w); ctx.fillText(view.nextNote, x, y); return; }
    const note = view.nextNote.replace(" if you stop now", ""), noteW = withNote ? Math.min(240, w * 0.32) : 0;
    if (withNote){ ctx.textAlign = "right"; ctx.fillStyle = col("--ov-muted"); fitFont(ctx, note, "500", UI, px * 0.5, noteW); ctx.fillText(note, x + w, y); ctx.textAlign = "left"; }
    ctx.fillStyle = col("--ov-muted"); ctx.font = "500 " + px + "px " + UI;
    const lw = ctx.measureText("Next: ").width; ctx.fillText("Next: ", x, y);
    ctx.fillStyle = col("--ov-fg"); fitFont(ctx, view.nextName, "700", UI, px, w - lw - noteW - 12); ctx.fillText(view.nextName, x + lw, y);
  }
  // A canvas cannot hold a clickable button, so before the meeting it points at the window's own ⏯ control.
  function drawTopRight(g, x, y, px){
    const { ctx, col, UI } = g;
    if (view.state !== "idle" || !view.blocks.length){ ctx.fillText(view.slotInfo, x, y); return; }
    ctx.fillStyle = col("--ov-ok"); ctx.font = "700 " + px * 1.15 + "px " + UI;
    ctx.fillText("▶ press ⏯ to start", x, y);
  }
  // Wide and square: stacked, scaled to the canvas width; the clock takes whatever height is left.
  function drawStack(g){
    const { ctx, W, H, col, UI, NUM } = g, k = W / 720, P = 28 * k;
    ctx.fillStyle = col("--ov-muted"); ctx.font = "500 " + 20 * k + "px " + UI;
    ctx.textAlign = "left"; ctx.fillText(view.pos, P, P + 18 * k);
    ctx.textAlign = "right"; drawTopRight(g, W - P, P + 18 * k, 20 * k);
    ctx.textAlign = "left"; ctx.fillStyle = col("--ov-fg");
    const nameY = P + 64 * k;
    fitFont(ctx, view.name, "700", UI, 40 * k, W - 2 * P); ctx.fillText(view.name, P, nameY);
    const barY = H - 108 * k, blkY = H - 88 * k, nextY = H - 26 * k;
    const top = nameY + 8 * k, avail = barY - 14 * k - top;
    ctx.fillStyle = g.stateCol;
    // Digit cap height is about 0.74em; centre the digits in the free band so they never touch the name.
    const px = fitFont(ctx, view.time, "800", NUM, avail * 0.92 / 0.74 * 0.8 * clk(), view.over ? W - 2 * P - 110 * k : W - 2 * P);
    const ty = top + avail / 2 + px * 0.37;
    ctx.fillText(view.time, P - 4 * k, ty);
    if (view.over){ const tw = ctx.measureText(view.time).width; ctx.font = "600 " + 28 * k + "px " + NUM; ctx.fillStyle = col("--ov-muted"); ctx.fillText("over", P + tw + 12 * k, ty); }
    ctx.fillStyle = col("--ov-line"); ctx.fillRect(P, barY, W - 2 * P, 8 * k);
    ctx.fillStyle = g.stateCol; ctx.fillRect(P, barY, (W - 2 * P) * view.bar, 8 * k);
    drawBlocks(g, P, blkY, W - 2 * P, 12 * k);
    drawNext(g, P, nextY, W - 2 * P, 44 * k, true);
  }
  // Thin strip: clock on the left, who is speaking and who is next on the right, blocks along the bottom.
  function drawStrip(g){
    const { ctx, W, H, col, UI, NUM } = g, P = 22;
    ctx.fillStyle = col("--ov-muted"); ctx.font = "500 16px " + UI;
    ctx.textAlign = "left"; ctx.fillText(view.pos, P, P + 10);
    ctx.textAlign = "right"; drawTopRight(g, W - P, P + 10, 16);
    const blkY = H - 28, base = blkY - 18, leftW = W * 0.42;
    ctx.textAlign = "left"; ctx.fillStyle = g.stateCol;
    const px = fitFont(ctx, view.time, "800", NUM, (base - P - 22) / 0.74 * clk(), leftW);
    ctx.fillText(view.time, P - 3, base);
    const x0 = P + ctx.measureText(view.time).width + 28, rw = W - x0 - P;
    ctx.fillStyle = col("--ov-fg"); fitFont(ctx, view.name, "700", UI, 40, rw); ctx.fillText(view.name, x0, base - 42);
    drawNext(g, x0, base, rw, 30, false);
    drawBlocks(g, P, blkY, W - 2 * P, 12);
  }

  async function docPip(){
    const [w, h] = DOC_SIZES[S.shape] || DOC_SIZES.wide;
    pipWin = await documentPictureInPicture.requestWindow({ width: w, height: h });
    for (const ss of document.styleSheets){
      try { const st = pipWin.document.createElement("style"); st.textContent = [...ss.cssRules].map(x => x.cssText).join("\n"); pipWin.document.head.appendChild(st); }
      catch(e){ if (ss.href){ const l = pipWin.document.createElement("link"); l.rel = "stylesheet"; l.href = ss.href; pipWin.document.head.appendChild(l); } }
    }
    pipWin.document.title = "CorpTimer";
    pipWin.document.body.className = "pip";
    pipWin.document.body.appendChild($("ov"));
    pipWin.addEventListener("keydown", onKey);
    $("floatNote").hidden = false; $("btnFloat").textContent = "Close float";
    pipWin.addEventListener("pagehide", () => {
      $("ovSlot").appendChild($("ov"));
      pipWin = null; $("floatNote").hidden = true; $("btnFloat").textContent = "Float timer";
    });
  }

  function onKey(ev){
    const t = ev.target; if (t && (t.closest('dialog') || t.tagName === 'BUTTON' || t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
    if (ev.key === "-" || ev.key === "_"){ ev.preventDefault(); setClock((+S.clock || 50) - 5); return; }
    if (ev.key === "=" || ev.key === "+"){ ev.preventDefault(); setClock((+S.clock || 50) + 5); return; }
    if (ev.code === "Space" || ev.key === "ArrowRight" || ev.key === "n" || ev.key === "N"){ ev.preventDefault(); next(); }
    else if (ev.key === "p" || ev.key === "P"){ ev.preventDefault(); togglePause(); }
    else if (ev.key === "ArrowLeft"){ ev.preventDefault(); back(); }
  }

  // ---- wire up ----
  $("btnNext").addEventListener("click", next);
  $("ovGo").addEventListener("click", next);
  $("btnBack").addEventListener("click", back);
  $("btnPause").addEventListener("click", togglePause);
  $("ovPause").addEventListener("click", togglePause);
  $("btnReset").addEventListener("click", reset);
  $("btnFloat").addEventListener("click", floatOut);
  $("btnDock").addEventListener("click", () => pipWin && pipWin.close());
  $("clkMinus").addEventListener("click", () => nudgeClock(-MIN));
  $("clkPlus").addEventListener("click", () => nudgeClock(MIN));
  $("btnAdd").addEventListener("click", () => addItem("person"));
  $("btnEqual").addEventListener("click", equalize);
  $("btnTopic").addEventListener("click", () => addItem("topic"));
  $("extend-current").addEventListener('click',extendCurrent);
  $("end-policy").addEventListener('change',e=>{S.endPolicy=e.target.value==='auto'?'auto':'manual';if(S.endPolicy==='auto'&&S.run?.cur&&S.run.pauseAt==null&&elapsed()>=deadlineFor(S.run.cur.id,S.run.cur.start)){next();return;}save();tick();});
  const tm = $("totalMin"); let tmBase = null;
  const snapshot = () => { const b = {}; S.agenda.forEach(a => b[a.id] = a.min); return b; };
  tm.addEventListener("focus", () => { tmBase = snapshot(); });
  tm.addEventListener("input", () => {
    const v = parseFloat(tm.value); if (!(v > 0)) return;
    S.total = v;
    if (S.autoSplit) rebalance(); else rescaleTo(v, tmBase || (tmBase = snapshot()));
    save(); tick();
  });
  tm.addEventListener("blur", () => { tmBase = null; tick(); });
  const fl = $("setFloor"), wa = $("setWarn"), so = $("setSound"), sp = $("setSplit"), sh = $("setShape");
  fl.value = S.floor; wa.value = S.warn; so.checked = !!S.sound; sp.checked = !!S.autoSplit; sh.value = SHAPES[S.shape] ? S.shape : "wide";
  fl.addEventListener("input", () => { S.floor = Math.max(0, parseFloat(fl.value) || 0); save(); tick(); });
  wa.addEventListener("input", () => { S.warn = Math.max(0, parseFloat(wa.value) || 0); save(); tick(); });
  so.addEventListener("change", () => { S.sound = so.checked; if (so.checked) initAudio(); save(); });
  sp.addEventListener("change", () => {
    S.autoSplit = sp.checked;
    if (S.autoSplit){ S.total = round2(total() / MIN); S.agenda.forEach(a => delete a.pin); rebalance(); }
    save(); tick();
  });
  setClock(S.clock);
  $("setClock").addEventListener("input", e => setClock(+e.target.value));
  const kp = $("keepProp"); kp.checked = S.keepProp !== false;
  kp.addEventListener("change", () => { S.keepProp = kp.checked; save(); tick(); });
  sh.addEventListener("change", () => {
    S.shape = sh.value; save(); tick();
    if (pipWin){ const [w, h] = DOC_SIZES[S.shape]; try { pipWin.resizeTo(w, h); } catch(e){} }
  });
  document.addEventListener("keydown", onKey);

  window.relayTimer = {
    snapshot:()=>structuredClone(S),
    replace(input){ S=normalizeState(input); resetBeeps();
      fl.value=S.floor;wa.value=S.warn;so.checked=S.sound;sp.checked=S.autoSplit;sh.value=S.shape;kp.checked=S.keepProp;
      setClock(S.clock);save();renderRos();tick(); },
    plan(){const p=structuredClone(S);p.run=null;p.reports=[];p.parking=[];return p;},
    command(action){if(action==='next')next();if(action==='pause')togglePause();if(action==='undo')back();if(action==='extend')extendCurrent();if(action==='reset'){archiveRun();S.run=null;resetBeeps();save();renderRos();tick();}},
    setParking(items){S.parking=cleanParking(items);save();},
    isRunning:()=>!!S.run&&!isDone(),
    closeFloat(){if(pipWin)pipWin.close();if(vpip)document.exitPictureInPicture().catch(closeVideoPip);}
  };
  document.dispatchEvent(new Event('relay:ready'));
  renderRos(); tick();
  // Ticks come from a worker: Chrome throttles page timers in background tabs (down to once a minute),
  // which would freeze the floating window while the meeting tab is in front.
  try {
    const src = "setInterval(function(){postMessage(0)},250);";
    const w = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
    w.onmessage = tick;
  } catch(e){ setInterval(tick, 250); }
})();
