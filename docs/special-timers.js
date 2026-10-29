import {stageTick} from './transition-sound.js';
import {intervalCue} from './interval-cues.js';
import {CuePlayer} from './cue-player.js';
import {createTimeline} from './timer-timeline.js';
import {writeSetting} from './timer-store.js';
import {toggleFullscreen} from './fullscreen.js';
import { buildSequence, IntervalClock, ChessClock, formatTime, clamp, newYearTarget } from './timer-engine.js';
import { defaults } from './timer-forms.js';

const kind = document.body.dataset.timerKind;
const slug = document.body.dataset.timerSlug;
const $ = id => document.getElementById(id);
const form = $('timer-settings');
const stage = $('clock-stage');
const fields = form.elements;
const base = structuredClone(defaults[kind]);
if (document.body.dataset.minutes) base.duration = Number(document.body.dataset.minutes) * 60;
const key = `corptimer:tool:${slug}:v1`;
const presetKey = `corptimer:presets:${slug}:v1`;
const initialSaved = readStorage(key);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
let config = structuredClone(base), clock, audio, gain, wake, lastIndex = -1, lastSecond = -1, lastDone = false;
let stopwatch = { elapsed: 0, anchor: null, running: false, laps: [] }, yearTarget, lastSave = 0, midnightBase=0;
let timelineWasRunning=false;
let presetRows = [], audioReported = false, initializing=true;
function notice(message) { $('runtime-note').textContent = message; }
function readStorage(storageKey) { try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; } }
function writeStorage(storageKey, value) {
  try { return writeSetting(storageKey,value,{localOnly:initializing||(storageKey===key&&isRunning())}); }
  catch { notice('Browser storage is unavailable or full. Export your setup to keep a copy.'); return false; }
}
function cleanConfig(raw) {
  const c = structuredClone(base);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Choose a valid timer setup.');
  for (const name of Object.keys(c)) {
    if (name === 'overrides') continue;
    if (typeof c[name] === 'number' && Number.isFinite(Number(raw[name]))) c[name] = Number(raw[name]);
    else if (typeof c[name] === 'boolean' && typeof raw[name] === 'boolean') c[name] = raw[name];
    else if (typeof c[name] === 'string' && typeof raw[name] === 'string') c[name] = raw[name].slice(0, 100);
  }
  if (!['gong','bell','beep','off'].includes(c.sound)) c.sound = base.sound;
  c.volume = clamp(c.volume, 0, 100);
  if (c.overrides) c.overrides = Array.isArray(raw.overrides) ? raw.overrides.slice(0,99).map(r => ({ name: String(r?.name || '').slice(0,100), work: clamp(r?.work,1,86400,180), rest: clamp(r?.rest,0,86400,60) })) : [];
  if (kind === 'newyear' && !Array.from(fields.zone.options).some(o => o.value === c.zone)) c.zone = 'local';
  return c;
}
function isRunning() { return kind === 'stopwatch' ? stopwatch.running : kind === 'newyear' ? false : !!clock?.running; }
function isLocked() { return kind === 'stopwatch' ? stopwatch.elapsed > 0 || stopwatch.running : kind === 'newyear' ? false : kind === 'chess' ? clock?.moves.some(Boolean) || clock?.times.some(t => t !== clock.initial) || clock?.running : clock?.index > 0 || clock?.elapsed > 0 || clock?.running || clock?.waiting || clock?.done; }
function syncForm() {
  for (const [name, value] of Object.entries(config)) {
    const field = fields.namedItem(name); if (!field || name === 'duration' || name === 'overrides') continue;
    if (field.type === 'checkbox') field.checked = value;
    else field.value = kind === 'pomodoro' && ['work','rest','longRest'].includes(name) ? value / 60 : value;
  }
  if (fields.hours) { fields.hours.value = Math.floor(config.duration/3600); fields.minutes.value = Math.floor(config.duration/60)%60; fields.seconds.value = config.duration%60; }
  $('volume-value').value = `${config.volume}%`;
  renderRoundFields();
}
function renderRoundFields() {
  if (!$('round-editor')) return;
  $('round-editor').hidden = !config.customRounds;
  if (!config.customRounds) return;
  const count = Math.floor(clamp(config.rounds,1,99));
  $('round-fields').innerHTML = Array.from({length:count}, (_,i) => {
    const row = config.overrides[i] || {name: kind === 'boxing' ? `Round ${i+1}` : `Work ${i+1}`, work: config.work, rest: config.rest};
    return `<div class="round-field"><label>Round ${i+1}<input data-round="${i}" data-key="name" value="${esc(row.name)}" maxlength="100" aria-label="Round ${i+1} name"></label><label>Work, sec<input type="number" data-round="${i}" data-key="work" value="${row.work}" min="1" max="86400" required aria-label="Round ${i+1} work seconds"></label><label>Rest, sec<input type="number" data-round="${i}" data-key="rest" value="${row.rest}" min="0" max="86400" required aria-label="Round ${i+1} rest seconds"></label></div>`;
  }).join('');
}
function readForm() {
  const c = structuredClone(config);
  for (const name of Object.keys(base)) {
    const f = fields.namedItem(name); if (!f || name === 'duration' || name === 'overrides') continue;
    c[name] = f.type === 'checkbox' ? f.checked : typeof base[name] === 'number' ? Number(f.value) : f.value;
    if (kind === 'pomodoro' && ['work','rest','longRest'].includes(name)) c[name] *= 60;
  }
  if (fields.hours) c.duration = Number(fields.hours.value)*3600 + Number(fields.minutes.value)*60 + Number(fields.seconds.value);
  if (c.customRounds) {
    const rows = [];
    form.querySelectorAll('[data-round]').forEach(f => { const i=Number(f.dataset.round); rows[i] ||= {}; rows[i][f.dataset.key]=f.dataset.key==='name'?f.value:Number(f.value); });
    c.overrides = rows;
  }
  return c;
}
function setConfig(next) {
  const previous = structuredClone(config);
  config = cleanConfig(next); syncForm();
  Array.from(fields).forEach(f => { f.disabled = false; });
  if (!form.checkValidity() || (fields.hours && (config.duration <= 0 || config.duration > 86400))) {
    config = previous; syncForm(); lockFields(); throw new Error('This setup contains unsupported values. Use a duration from 1 second to 24 hours.');
  }
  $('form-error').textContent='';
  resetClock();
}
function updateConfig(event) {
  if (isLocked() && !['sound','volume','hideDigits','gong'].includes(event.target.name)) return;
  if (!form.checkValidity()) { $('form-error').textContent='Check the highlighted settings before starting.'; return; }
  const c = readForm();
  if (fields.hours && (c.duration <= 0 || c.duration > 86400)) { $('form-error').textContent='Choose a duration from 1 second to 24 hours.'; return; }
  $('form-error').textContent=''; config=c;
  $('volume-value').value = `${config.volume}%`;
  if (event.target.name==='customRounds' || event.target.name==='rounds') renderRoundFields();
  if (!isLocked()) resetClock();
  save(); render();
}
function resetClock() {
  if (kind === 'chess') { clock = new ChessClock(config.duration,config.increment,config.delay); clock.active=Number(config.first)===1?1:0; }
  else if (kind === 'newyear') {
    const zone = config.zone==='local'?Intl.DateTimeFormat().resolvedOptions().timeZone:config.zone;
    yearTarget = { ...newYearTarget(Date.now(),zone), zone };midnightBase=yearTarget.target;
  } else if (kind === 'stopwatch') stopwatch={elapsed:0,anchor:null,running:false,laps:[]};
  else clock=new IntervalClock(buildSequence(kind,config),config.automatic);
  lastIndex=-1; lastSecond=-1; lastDone=false;
  renderSequence(); renderLaps(); lockFields(); render(); save(); releaseWake();
}
function lockFields() {
  const locked = !!isLocked();
  Array.from(fields).forEach(f => { if (['sound','volume','hideDigits','gong'].includes(f.name) || f.id==='test-sound') return; f.disabled=locked; });
  $('delete-setup').disabled=locked||$('saved-presets').value==='';
  $('settings-notice').textContent=locked?'Reset the timer to edit this setup. Sound and volume can be changed while it runs.':'';
  form.querySelectorAll('[data-preset]').forEach(button=>{
    const pattern=presets[button.dataset.preset];
    const selected=!config.customRounds&&Object.entries(pattern).every(([name,value])=>config[name]===value);
    button.setAttribute('aria-pressed',String(selected));
  });
  form.querySelectorAll('[data-minutes]').forEach(button=>button.setAttribute('aria-pressed',String(config.duration===Number(button.dataset.minutes)*60)));
}
function renderSequence() {
  if (!$('sequence-list') || !clock?.sequence) return;
  $('sequence-list').innerHTML=clock.sequence.map((s,i)=>`<li data-step="${i}"><span>${esc(s.name)}${kind==='fitness'&&config.sets>1?` · set ${s.set}`:''}</span><span>${formatTime(s.ms)}</span></li>`).join('');
  $('sequence-total').textContent=`${formatTime(clock.sequence.reduce((sum,s)=>sum+s.ms,0))} total`;
  $('sequence-count').textContent=`${clock.sequence.length} interval${clock.sequence.length===1?'':'s'}`;
}
function save() {
  const state = kind==='stopwatch' ? {elapsed:stopwatch.elapsed,laps:stopwatch.laps} : kind==='chess' ? {times:clock.times,moves:clock.moves,active:clock.active,delayLeft:clock.delayLeft,flag:clock.flag} : clock ? {...clock.snapshot(),durations:clock.sequence.map(s=>s.ms)} : undefined;
  writeStorage(key,{config,state,yearTarget:kind==='newyear'?yearTarget:null,savedAt:Date.now()}); lastSave=Date.now();
}
function restore() {
  const saved=initialSaved; if (!saved) return;
  try {
    setConfig(saved.config);
    if (kind==='stopwatch' && saved.state) { stopwatch.elapsed=clamp(saved.state.elapsed,0,31536000000); stopwatch.laps=Array.isArray(saved.state.laps)?saved.state.laps.filter(n=>Number.isFinite(n)&&n>=0&&n<=stopwatch.elapsed).sort((a,b)=>a-b).slice(0,1000):[]; }
    else if (kind==='chess' && saved.state) {
      const s=saved.state; if (Array.isArray(s.times)&&s.times.length===2) clock.times=s.times.map(t=>clamp(t,0,31536000000));
      if (Array.isArray(s.moves)&&s.moves.length===2) clock.moves=s.moves.map(n=>Math.floor(clamp(n,0,100000)));
      clock.active=s.active===1?1:0; clock.delayLeft=clamp(s.delayLeft,0,clock.delay); clock.flag=s.flag===0||s.flag===1?s.flag:null;
    } else if (kind==='newyear' && saved.yearTarget) {
      const t=saved.yearTarget;
      if (t.zone===yearTarget.zone && Number.isFinite(t.target) && Date.now()-t.target>=0 && Date.now()-t.target<86400000) yearTarget=t;
    } else if (saved.state) {
      if (Array.isArray(saved.state.durations) && saved.state.durations.length===clock.sequence.length) saved.state.durations.forEach((ms,i)=>{clock.sequence[i].ms=clamp(ms,1000,86400000,clock.sequence[i].ms);});
      clock.restore(saved.state); renderSequence();
    }
    if (isLocked()) notice('Restored your last session, paused. Press Resume when you are ready.');
    renderLaps(); lockFields(); render(); save();
  } catch { config=structuredClone(base); syncForm(); resetClock(); notice('The saved setup could not be loaded. A fresh timer is ready.'); }
}
const cuePlayer=new CuePlayer();
async function armAudio() {
  if(config.sound==='off'||!config.volume)return;
  try{await cuePlayer.arm();}catch{notice('Sound could not load. Check your connection and try Test sound.');}
}
function tone(type=config.sound) {
  if(config.sound==='off'||!config.volume||(type==='gong'&&config.gong===false))return;
  cuePlayer.play(type,config.volume);
}
async function acquireWake() { try { if ('wakeLock' in navigator && !document.hidden && !wake) { wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>{wake=null;}); } } catch { /* Browser may deny wake lock in low power mode. */ } }
function releaseWake() { if (wake) { wake.release().catch(()=>{}); wake=null; } }
function audioCues(previousIndex, previousRemaining, wasDone) {
  if(clock.index!==previousIndex||clock.done&&!wasDone||clock.waiting&&previousRemaining>0)stageTick();
  const type=intervalCue(clock,{index:previousIndex,remaining:previousRemaining,done:wasDone},config,lastSecond);
  if(type)tone(type);
  lastSecond=Math.ceil(clock.remaining()/1000);
}

function tick() {
  timelineWasRunning=isRunning();
  const now=Date.now();
  if (kind==='stopwatch') { if (stopwatch.running) { stopwatch.elapsed+=Math.max(0,now-stopwatch.anchor);stopwatch.anchor=Math.max(now,stopwatch.anchor); } }
  else if (kind==='chess') { const wasFlag=clock.flag;clock.update(now);if(wasFlag===null&&clock.flag!==null)tone(); }
  else if (kind!=='newyear') { const idx=clock.index,remaining=clock.remaining(),done=clock.done;clock.update(now);audioCues(idx,remaining,done); }
  updateTimeline();render();
  if (now-lastSave>2000 && (isRunning()||kind==='newyear')) save();
  if (!isRunning()) releaseWake();
}
function render() {
  if (kind==='chess') return renderChess();
  if (kind==='newyear') return renderNewYear();
  if (kind==='stopwatch') {
    $('clock-time').textContent=formatTime(stopwatch.elapsed,true); $('clock-time').dataset.long=String($('clock-time').textContent.length>6); $('clock-status').textContent=stopwatch.running?'Running':stopwatch.elapsed?'Paused':'Ready';
    $('start-timer').textContent=stopwatch.running?'Pause':stopwatch.elapsed?'Resume':'Start';$('lap-timer').disabled=!stopwatch.running||stopwatch.laps.length>=1000;
    stage.dataset.paused=String(!stopwatch.running&&stopwatch.elapsed>0);document.title=`${formatTime(stopwatch.elapsed)} · Stopwatch | CorpTimer`;return;
  }
  const s=clock.sequence[clock.index],remaining=clock.remaining();
  stage.dataset.phase=s?.type||'work';stage.dataset.warning=String(!clock.done&&s?.type==='work'&&config.warning>0&&remaining<=config.warning*1000);stage.dataset.done=String(clock.done);stage.dataset.paused=String(!clock.running&&!clock.done&&isLocked());
  $('clock-status').textContent=clock.done?'Complete':clock.waiting?'Interval complete':clock.running?'Running':isLocked()?'Paused':'Ready';
  $('clock-position').textContent=s?.round?`${kind==='pomodoro'?'Session':'Round'} ${s.round} / ${config.rounds}${kind==='fitness'&&config.sets>1?` · Set ${s.set}/${config.sets}`:''}`:'';
  $('clock-phase').textContent=clock.done?'Nicely done.':s?.name||'Ready';
  $('clock-time').textContent=formatTime(remaining);$('clock-time').hidden=!!config.hideDigits;
  $('clock-time').dataset.long=String($('clock-time').textContent.length>5);
  $('clock-progress').style.transform=`scaleX(${clock.done?0:Math.min(1,remaining/(s?.ms||1))})`;
  $('clock-progressbar').setAttribute('aria-valuenow',String(Math.round(clock.done?0:remaining/(s?.ms||1)*100)));
  const next=clock.sequence[clock.index+1];
  $('clock-next').textContent=clock.done?'Reset to go again.':clock.waiting?'Press Next interval when you are ready.':next?`Up next: ${next.name} · ${formatTime(next.ms)}`:'Make this time yours.';
  $('start-timer').textContent=clock.done?'Start again':clock.running?'Pause':clock.waiting?'Continue':isLocked()?'Resume':'Start';
  if ($('next-interval')) $('next-interval').disabled=clock.done;
  $('extend-timer').disabled=clock.done;
  if(lastIndex!==clock.index||lastDone!==clock.done){
    document.querySelectorAll('[data-step]').forEach(el=>{const i=Number(el.dataset.step);el.classList.toggle('is-complete',i<clock.index||clock.done);if(i===clock.index&&!clock.done)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    $('clock-announcement').textContent=clock.done?'Timer complete':`${s?.name||'Ready'}. ${formatTime(remaining)} remaining.`;lastIndex=clock.index;lastDone=clock.done;
  }
  document.title=`${formatTime(remaining)} · ${document.body.dataset.timerTitle} | CorpTimer`;
}
function renderChess() {
  for (let i=0;i<2;i++) {
    $(`player-${i}`).setAttribute('aria-pressed',String(clock.active===i&&clock.flag===null));
    $(`player-${i}`).disabled=!clock.running||clock.active!==i;
    $(`player-time-${i}`).textContent=formatTime(clock.times[i]);
    $(`player-${i}`).dataset.long=String($(`player-time-${i}`).textContent.length>5);
    $(`player-moves-${i}`).textContent=`${clock.moves[i]} move${clock.moves[i]===1?'':'s'}${clock.active===i&&clock.running&&clock.delayLeft>0?` · Delay ${Math.ceil(clock.delayLeft/1000)}s`:''}`;
  }
  $('clock-status').textContent=clock.flag!==null?`${clock.flag===0?'White':'Black'} is out of time`:clock.running?`${clock.active===0?'White':'Black'} to move`:isLocked()?'Paused':'Ready';
  $('start-timer').disabled=clock.flag!==null;$('start-timer').textContent=clock.running?'Pause':isLocked()?'Resume':'Start match';
  $('clock-phase').textContent=clock.flag!==null?'Time is up.':clock.running?'Your move.':'Make time for a good game.';
  document.title=`${formatTime(clock.times[0])} / ${formatTime(clock.times[1])} · Chess Timer | CorpTimer`;
}
function renderNewYear() {
  const remaining=Math.max(0,yearTarget.target-Date.now()),seconds=Math.ceil(remaining/1000);
  const values=[Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60];
  values.forEach((v,i)=>{$(`newyear-${i}`).textContent=String(v).padStart(2,'0');});
  $('clock-phase').textContent=remaining?`Here comes ${yearTarget.year}.`:`Happy New Year ${yearTarget.year}!`;
  $('clock-status').textContent=remaining?'Counting down':'Midnight';
  $('clock-next').textContent=`January 1, ${yearTarget.year} · 00:00 · ${yearTarget.zone}`;
  $('next-year').hidden=remaining>0;
  if(!remaining&&!lastDone){stageTick();tone();$('clock-announcement').textContent=`Happy New Year ${yearTarget.year}!`;lastDone=true;}
  document.title=`${values[0]} days · New Year Countdown | CorpTimer`;
}
async function startPause() {
  if (!form.reportValidity()||$('form-error').textContent) return;
  if (!isLocked()) {
    config=readForm();
    if(fields.hours&&(config.duration<=0||config.duration>86400)){$('form-error').textContent='Choose a duration from 1 second to 24 hours.';return;}
    resetClock();
  }
  await armAudio();
  const now=Date.now();
  if(kind==='stopwatch'){tick();stopwatch.running=!stopwatch.running;stopwatch.anchor=stopwatch.running?now:null;}
  else if(kind==='chess'){if(clock.running)clock.pause(now);else clock.start(now);}
  else {
    if(clock.done){resetClock();clock.start(now);tone();}
    else if(clock.running)clock.pause(now);
    else if(clock.waiting){clock.next(now);clock.start(now);tone();}
    else{const fresh=!isLocked();clock.start(now);if(fresh)tone();}
  }
  if(isRunning())await acquireWake();else releaseWake();lockFields();render();save();
}
function addLap() {
  stageTick(); if(!stopwatch.running||stopwatch.laps.length>=1000)return;tick();stopwatch.laps.push(stopwatch.elapsed);renderLaps();save(); }
function renderLaps() {
  if(!$('lap-rows'))return;
  $('lap-rows').innerHTML=stopwatch.laps.map((time,i)=>`<tr><td>${i+1}</td><td>${formatTime(time-(stopwatch.laps[i-1]||0),true)}</td><td>${formatTime(time,true)}</td></tr>`).reverse().join('');
  $('lap-empty').hidden=stopwatch.laps.length>0;$('export-laps').disabled=!stopwatch.laps.length;
}
function download(name,text,type='application/json') { const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
function renderPresets(){
  const saved=readStorage(presetKey);presetRows=Array.isArray(saved)?saved.filter(p=>p&&typeof p.name==='string'&&p.config).slice(0,30):[];
  $('saved-presets').innerHTML='<option value="">Load a saved setup…</option>'+presetRows.map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join('');
  $('delete-setup').disabled=true;
}
const presets={boxing:{rounds:3,work:180,rest:60},amateur:{rounds:3,work:120,rest:60},bag:{rounds:12,work:180,rest:60},tabata:{rounds:8,work:20,rest:10,sets:1},hiit:{rounds:10,work:40,rest:20,sets:1},emom:{rounds:10,work:60,rest:0,sets:1},amrap:{rounds:1,work:1200,rest:0,sets:1},bullet:{duration:60,increment:0,delay:0},blitz:{duration:180,increment:2,delay:0},rapid:{duration:600,increment:0,delay:0},casual:{duration:900,increment:10,delay:0}};
form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('change',updateConfig);form.addEventListener('input',updateConfig);
form.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{setConfig({...config,...presets[b.dataset.preset],customRounds:false,overrides:[]});});
form.querySelectorAll('[data-minutes]').forEach(b=>b.onclick=()=>setConfig({...config,duration:Number(b.dataset.minutes)*60}));
$('test-sound').onclick=async()=>{await armAudio();if(config.sound==='off'||!config.volume)notice('Choose a sound and raise the volume to test it.');else{tone();notice('Sound test played. Check your device volume before starting.');}};
if($('start-timer'))$('start-timer').onclick=startPause;
if($('reset-timer'))$('reset-timer').onclick=()=>{resetClock();notice('Timer reset. Your setup is ready.');};
if($('next-interval'))$('next-interval').onclick=async()=>{await armAudio();const waiting=clock.waiting,done=clock.done;clock.next(Date.now());if(waiting&&!clock.done)clock.start(Date.now());if(!done){stageTick();tone();}render();lockFields();save();};
if($('extend-timer'))$('extend-timer').onclick=()=>{clock.update(Date.now());clock.extend(60000);renderSequence();render();save();};
if($('lap-timer'))$('lap-timer').onclick=addLap;
if($('export-laps'))$('export-laps').onclick=()=>download('corptimer-laps.csv','Lap,Split seconds,Elapsed seconds\r\n'+stopwatch.laps.map((t,i)=>`${i+1},${((t-(stopwatch.laps[i-1]||0))/1000).toFixed(3)},${(t/1000).toFixed(3)}`).join('\r\n'),'text/csv');
for(let i=0;i<2;i++)if($(`player-${i}`))$(`player-${i}`).onclick=async()=>{await armAudio();if(clock.active===i&&clock.switch(Date.now())){stageTick();tone('beep');}render();lockFields();save();};
if($('swap-chess'))$('swap-chess').onclick=()=>{const players=$('chess-players');players.classList.toggle('swapped');players.style.direction=players.classList.contains('swapped')?'rtl':'ltr';};
if($('next-year'))$('next-year').onclick=()=>{resetClock();};
if($('enable-newyear-sound'))$('enable-newyear-sound').onclick=async()=>{await armAudio();tone();notice('Midnight alarm enabled for this open tab.');};
$('fullscreen-timer').onclick=()=>toggleFullscreen(stage,$('fullscreen-timer'));
document.addEventListener('fullscreenchange',()=>{$('fullscreen-timer').textContent=document.fullscreenElement?'Exit fullscreen':'Fullscreen';});
$('save-setup').onclick=()=>{if(!form.reportValidity()||$('form-error').textContent)return;$('preset-dialog').showModal();$('preset-name').focus();};
$('preset-cancel').onclick=()=>$('preset-dialog').close();
$('preset-form').onsubmit=e=>{e.preventDefault();const name=$('preset-name').value.trim();if(!name)return;const existing=presetRows.findIndex(p=>p.name===name);if(existing<0&&presetRows.length>=30){$('preset-error').textContent='You have 30 saved setups. Export a backup or reuse a name to replace one.';return;}const row={name,config:structuredClone(config)};if(existing>=0)presetRows[existing]=row;else presetRows.push(row);if(writeStorage(presetKey,presetRows)){renderPresets();$('preset-dialog').close();notice(`Saved “${name}” in this browser.`);}};
$('saved-presets').onchange=()=>{if($('saved-presets').value===''){$('delete-setup').disabled=true;return;}try{setConfig(presetRows[Number($('saved-presets').value)].config);$('delete-setup').disabled=false;notice('Saved setup loaded.');}catch(e){notice(e.message);}};
$('delete-setup').onclick=()=>{const selected=$('saved-presets').value;if(selected==='')return;presetRows.splice(Number(selected),1);if(writeStorage(presetKey,presetRows)){renderPresets();notice('Saved setup removed. The current timer is unchanged.');}};
$('export-setup').onclick=()=>{if(!form.reportValidity()||$('form-error').textContent)return;download(`corptimer-${slug}.json`,JSON.stringify({version:1,kind,config},null,2));};
$('import-setup').onclick=()=>$('import-file').click();
$('import-file').onchange=async()=>{const file=$('import-file').files[0];if(!file)return;try{if(file.size>100000)throw new Error('Choose a setup file smaller than 100 KB.');const data=JSON.parse(await file.text());if(data.version!==1||data.kind!==kind)throw new Error(`Choose a ${document.body.dataset.timerTitle} setup exported from this tool.`);setConfig(data.config);notice('Setup imported. Ready to start.');}catch(e){notice(e instanceof SyntaxError?'This file is not valid JSON. Choose an exported timer setup.':e.message);}finally{$('import-file').value='';}};
document.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea,button,summary,a,dialog')||e.altKey||e.ctrlKey||e.metaKey||e.repeat)return;if(e.code==='Space'&&kind!=='newyear'){e.preventDefault();if(kind==='chess'&&clock.running){if(clock.switch(Date.now()))stageTick();render();save();}else startPause();}if(kind==='stopwatch'&&e.key.toLowerCase()==='l')addLap();});
window.addEventListener('pagehide',()=>{tick();save();});
document.addEventListener('visibilitychange',()=>{tick();save();if(!document.hidden&&isRunning())acquireWake();if(!document.hidden&&audio?.state==='suspended'&&!audioReported){audioReported=true;notice('The browser suspended audio while hidden. Test sound again if you need an alarm.');}});
syncForm();resetClock();restore();renderPresets();initializing=false;
setInterval(tick,100);
document.body.dataset.timerReady='true';
if('serviceWorker' in navigator)navigator.serviceWorker.register('../sw.js').catch(()=>{});

const timelineHost=document.createElement('div');stage.after(timelineHost);const timelines=[];
if(kind==='chess') {
  for(let i=0;i<2;i++)timelines.push(createTimeline(timelineHost,{label:(i?'Black':'White')+' time bank',seek:value=>{clock.pause(Date.now());clock.times[i]=value*1000;clock.flag=null;render();save();}}));
} else timelines.push(createTimeline(timelineHost,{label:kind==='newyear'?'Adjust midnight target (hours around chosen midnight)':'Timeline',seek:value=>{
  if(kind==='stopwatch'){stopwatch.running=false;stopwatch.anchor=null;stopwatch.elapsed=value*1000;stopwatch.laps=stopwatch.laps.filter(v=>v<=stopwatch.elapsed);renderLaps();}
  else if(kind==='newyear'){yearTarget.target=midnightBase+(value-43200)*1000;}
  else{clock.pause(Date.now());let ms=value*1000;clock.index=0;while(clock.index<clock.sequence.length-1&&ms>=clock.sequence[clock.index].ms){ms-=clock.sequence[clock.index].ms;clock.index++;}clock.elapsed=ms;clock.done=false;clock.waiting=false;clock.anchor=null;lastIndex=-1;clock.update(Date.now());}
  render();lockFields();save();notice('Time adjusted. Press Resume when ready.');
}}));
if(kind==='newyear')midnightBase=yearTarget.target;
function updateTimeline(){
  if(!timelines.length)return;
  if(kind==='chess')timelines.forEach((t,i)=>t.update(clock.times[i]/1000,Math.max(clock.initial,clock.times[i])/1000,[],clock.running,Math.max(0,(clock.initial-clock.times[i])/1000)));
  else if(kind==='newyear')timelines[0].update(43200+(yearTarget.target-midnightBase)/1000,86400,[],true,86400-Math.max(0,(yearTarget.target-Date.now())/1000));
  else if(kind==='stopwatch')timelines[0].update(stopwatch.elapsed/1000,Math.max(600,Math.ceil(stopwatch.elapsed/600000)*600),[],stopwatch.running);
  else{const total=clock.sequence.reduce((n,s)=>n+s.ms,0);timelines[0].update((clock.done?total:clock.sequence.slice(0,clock.index).reduce((n,s)=>n+s.ms,0)+clock.elapsed)/1000,total/1000,clock.sequence.map(s=>({name:s.name,seconds:s.ms/1000})),clock.running||timelineWasRunning);}
}
updateTimeline();
