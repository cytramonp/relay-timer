import {enhanceGuides} from './enhance-guides.mjs';
// Build real, crawlable documents for static hosting; no runtime build required.
import fs from 'node:fs';
import path from 'node:path';
import { timers, timerHref } from '../docs/timer-catalog.js';
import { settingsMarkup } from '../docs/timer-forms.js';
import { renderTimerGuide } from '../docs/timer-guides.js';
import { renderTimerMenu } from '../docs/timer-menu.js';
import { specialtyTimers } from '../docs/specialty-catalog.js';
import { buildSpecialtyPages, groupedDirectory } from './specialty-pages.mjs';
if(fs.existsSync('mobile/src/core'))fs.copyFileSync('docs/board-engine.js','mobile/src/core/board-engine.js');
const root=path.resolve('docs');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const artNames={boxing:'Boxing ring and red gloves',fitness:'Dumbbell and teal water bottle',pomodoro:'Tomato timer and a notepad',classroom:'Classroom board and books',chess:'Chess knight and rook',stopwatch:'Stopwatch with a red hand',simple:'Countdown dial with a red time wedge',newyear:'New Year party popper and a midnight clock'};
const art=kind=>`<div class="timer-art art-${kind}" role="img" aria-label="${artNames[kind]}"></div>`;
function documentShell({title,description,slug,body,kind='',minutes=''}){
  const canonical=`https://corptimer.com/${slug}/`;
  const schema=kind?{ '@context':'https://schema.org','@type':'WebApplication',name:title,url:canonical,description,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',isAccessibleForFree:true,browserRequirements:'JavaScript enabled. Keep the browser tab open for live alerts.' }:{'@context':'https://schema.org','@type':'CollectionPage',name:title,url:canonical,description,mainEntity:{'@type':'ItemList',itemListElement:timers.map((timer,i)=>({'@type':'ListItem',position:i+1,name:timer.title,url:`https://corptimer.com/${timer.slug?timer.slug+'/':''}`}))}};
  return `<!doctype html>
<html lang="en" data-theme="light"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#eeece5"><meta name="description" content="${escape(description)}"><meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
<title>${escape(title)} — Free Online Timer | CorpTimer</title><link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escape(title)} | CorpTimer"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="website">
<link rel="icon" href="../icon.svg?v=9" type="image/svg+xml"><link rel="manifest" href="../manifest.webmanifest"><link rel="stylesheet" href="../base.css"><link rel="stylesheet" href="../workspace.css?v=8"><link rel="stylesheet" href="../editorial.css?v=9"><link rel="stylesheet" href="../blocks.css?v=10"><link rel="stylesheet" href="../special-timers.css?v=21">
<script type="application/ld+json">${JSON.stringify(schema)}</script></head>
<body class="tool-page" data-timer-kind="${kind}" data-timer-slug="${slug}" data-timer-title="${escape(title)}" data-minutes="${minutes}">
<a class="skip" href="#timer-main">Skip to timer</a><header class="app-header"><a href="../" class="wordmark" aria-label="CorpTimer home"><img class="brand-mark" src="../assets/corptimer-mark.svg" width="64" height="30" alt=""><span>Corp<span class="brand-timer">Timer</span></span></a><nav aria-label="Timers"><a class="nav-link" href="../?home=meeting">Meeting Timer</a>${renderTimerMenu(slug)}</nav></header>
<main id="timer-main" class="tool-wrap">${body}<footer class="tool-footer"><span>Free version. No sign-in needed.<br>Sign in with Google to sync your timer setups.</span><span><a href="../?home=meeting">Meeting Timer</a> · <a href="../timers/">All timers</a></span></footer></main>
<script type="module" src="../timer-account.js"></script><script type="module" src="../timer-menu.js?v=21"></script><script type="module" src="../timer-favorites.js?v=2"></script>${kind?'<script type="module" src="../special-timers.js?v=21"></script>':''}</body></html>\n`;
}
const mainClock=`<div id="clock-time" class="big-clock" role="timer" aria-label="Time remaining">5:00</div><div id="clock-progressbar" class="clock-bar" role="progressbar" aria-label="Time remaining" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i id="clock-progress"></i></div><div id="clock-next" class="clock-next">Ready when you are.</div>`;
const start=`<button type="button" id="start-timer" class="start-button">Start</button>`;
const reset=`<button type="button" id="reset-timer" class="reset-button">Reset</button>`;
for(const t of timers.filter(t=>t.slug)){
  if(t.kind==='specialty')continue;
  const {kind}=t;
  let display=mainClock,actions=start+(['boxing','fitness','pomodoro'].includes(kind)?'<button type="button" id="next-interval">Next interval</button>':'')+reset;
  if(kind==='chess'){
    display=`<div id="chess-players" class="chess-players">${['White','Black'].map((p,i)=>`<button type="button" class="chess-player" id="player-${i}" aria-pressed="${i===0}" aria-label="${p}: end turn"><span>${p}</span><strong id="player-time-${i}">5:00</strong><small id="player-moves-${i}">0 moves</small></button>`).join('')}</div>`;
    actions=start+`<button type="button" id="swap-chess">Swap sides</button>`+reset;
  }else if(kind==='stopwatch'){
    display='<div id="clock-time" class="big-clock" role="timer" aria-label="Elapsed time">0:00.0</div><div class="clock-next">Every lap is a little progress.</div>';
    actions=start+'<button type="button" id="lap-timer" disabled>Lap</button>'+reset;
  }else if(kind==='newyear'){
    display=`<div class="newyear-clock" role="timer" aria-label="Time until New Year">${['Days','Hours','Minutes','Seconds'].map((l,i)=>`<div><strong id="newyear-${i}">00</strong><span>${l}</span></div>`).join('')}</div><div id="clock-next" class="clock-next"></div>`;
    actions='<button type="button" id="enable-newyear-sound">Enable midnight alarm</button><button type="button" id="next-year" hidden>Count down to next year</button>';
  }
  const sequence=['boxing','fitness','pomodoro'].includes(kind)?'<div class="sequence-summary"><span id="sequence-count"></span><span id="sequence-total"></span></div><ol id="sequence-list" class="sequence-list" aria-label="Interval plan"></ol>':'';
  const laps=kind==='stopwatch'?'<div class="lap-actions"><h2>Laps & splits</h2><button id="export-laps" type="button" disabled>Export CSV</button></div><p id="lap-empty" class="field-help">Your laps will appear here. Press L or tap Lap while running.</p><table class="lap-table"><thead><tr><th scope="col">Lap</th><th scope="col">Split</th><th scope="col">Total</th></tr></thead><tbody id="lap-rows"></tbody></table>':'';
  const extend=!['stopwatch','chess','newyear'].includes(kind)?'<button type="button" id="extend-timer">+1 minute</button>':'';
  const initialTime=t.minutes?`${t.minutes}:00`:kind==='boxing'?'0:10':kind==='fitness'?'0:10':kind==='pomodoro'?'25:00':kind==='classroom'?'10:00':'5:00';
  const html=documentShell({...t,body:`
<div class="tool-heading illustrated-heading"><h1>${escape(t.title)}</h1><p>${escape(t.description)}</p>${art(kind)}</div>
<div class="tool-layout"><div class="tool-left"><section id="clock-stage" class="clock-stage" aria-label="${escape(t.title)} controls"><button type="button" id="fullscreen-timer" class="stage-fullscreen">Fullscreen</button><div class="clock-meta"><span id="clock-status">Ready</span><span id="clock-position"></span></div><h2 id="clock-phase" class="clock-phase">${kind==='boxing'?'Get ready':kind==='fitness'?'Get ready':kind==='pomodoro'?'Time to focus':escape(t.short)}</h2>${display.replace('>5:00</div>',`>${initialTime}</div>`)}<div class="clock-actions">${actions}</div></section><div class="clock-utilities"><p>${kind==='chess'?'Tap your active clock or press Space to end your turn.':kind==='newyear'?'Your chosen midnight, wherever you are.':'Space to start or pause.'}</p>${extend}</div><p id="runtime-note" class="runtime-note" role="status"></p><p class="runtime-note">Keep this tab open. Mobile and background alarms depend on your browser and device. ${kind==='newyear'?'The countdown follows your device clock.':'After a reload, saved sessions return paused.'}</p>${sequence}${laps}</div>
<aside class="tool-settings" aria-labelledby="settings-title"><h2 id="settings-title">${kind==='chess'?'Set the match':kind==='stopwatch'?'Your stopwatch':kind==='newyear'?'Choose your midnight':kind==='boxing'?'Build your rounds':kind==='fitness'?'Build your workout':kind==='pomodoro'?'Find your focus':'Make it your time'}</h2><p id="settings-notice" class="settings-notice"></p><form id="timer-settings">${settingsMarkup(kind,t.minutes)}<p id="form-error" role="alert"></p><div class="preset-storage"><button type="button" id="save-setup">Save current as template</button><button type="button" id="export-setup">Export</button><button type="button" id="import-setup">Import</button><label class="sr-only" for="saved-presets">Saved setups</label><select id="saved-presets"><option value="">Load a saved setup…</option></select><button type="button" id="delete-setup" disabled>Remove saved setup</button><input id="import-file" type="file" accept=".json,application/json" hidden></div></form></aside></div>
<section class="related-timers related-picker" aria-label="Other timers">${renderTimerMenu(t.slug,'../','Choose a timer')}<a class="browse-timers" href="../timers/">Browse all timers</a></section>
${renderTimerGuide(t)}
<dialog id="preset-dialog" aria-labelledby="preset-title"><form id="preset-form"><h2 id="preset-title">Save this setup</h2><label for="preset-name">Setup name</label><input id="preset-name" required maxlength="80" placeholder="My training rounds"><p class="field-help">Saved locally and synced when signed in. Reusing a name replaces that template.</p><p id="preset-error" role="alert"></p><div class="dialog-actions"><button type="button" id="preset-cancel">Cancel</button><button class="primary" type="submit">Save setup</button></div></form></dialog><div id="clock-announcement" class="sr-only" aria-live="polite"></div><noscript><p>Enable JavaScript to run this timer. You can still explore the timer guides and links on this page.</p></noscript>`});
  fs.mkdirSync(path.join(root,t.slug),{recursive:true});fs.writeFileSync(path.join(root,t.slug,'index.html'),html);
}
const catalogRows=groupedDirectory(timers.filter(t=>!t.minutes));
fs.mkdirSync(path.join(root,'timers'),{recursive:true});
fs.writeFileSync(path.join(root,'timers/index.html'),documentShell({title:'Other Timers',description:'Find your timer: meetings, boxing rounds, fitness intervals, Pomodoro, classroom activities, chess, stopwatch and 5 to 30 minute countdowns.',slug:'timers',body:`<div class="tool-heading"><h1>Different days. Different timers.</h1><p>Time for a conversation, a workout, a little focus or a fresh start. Choose a timer and make it yours.</p></div><section class="directory-group"><div class="catalog-tools"><h2>A timer for what you do</h2><button type="button" data-collapse>Collapse to Groups</button><a class="create-timer" href="../custom-timer/">Make your own timer</a></div><div class="directory-list">${catalogRows}</div></section><section class="directory-group"><h2>Just a few minutes?</h2><p class="field-help">A countdown, already set. Pick a duration and press Start.</p><div class="duration-directory">${timers.filter(t=>t.minutes).map(t=>`<a href="${timerHref(t)}"><strong>${t.minutes}</strong>minute timer</a>`).join('')}</div></section><section class="tool-info"><div><h2>Your time. Your setup.</h2><p>The free version works without an account. Adjust the timing, check the sound and use fullscreen when you need a bigger clock. Save a setup in your browser or export it for another device.</p></div><div><h2>For a room full of people</h2><p>The <a href="../?home=meeting">Meeting Timer</a> includes an editable agenda, time carryover, floating display and live audience links. For a single classroom activity, choose the simpler Classroom Timer.</p></div></section>`}));
const urls=['https://corptimer.com/custom-timer/','https://corptimer.com/','https://corptimer.com/timers/',...timers.filter(t=>t.slug).map(t=>`https://corptimer.com/${t.slug}/`)];
buildSpecialtyPages(documentShell);
fs.mkdirSync(path.join(root,'custom-timer'),{recursive:true});
fs.writeFileSync(path.join(root,'custom-timer/index.html'),documentShell({title:'Make your own timer',description:'Build your own timer with editable slots, independent clocks, player time banks and personal sound cues.',slug:'custom-timer',kind:'specialty',body:`<div class="tool-heading"><h1>Make your own timer</h1><p>Your slots. Your signals. Your pace. Create a sequence, independent clocks or player time banks.</p></div><div class="board-actions"><button id="board-start">Start all</button><button id="board-pause">Pause all</button><button id="board-add">Add clock</button><button id="board-export">Export CSV</button><button id="board-sound">Sound off</button><button id="board-fullscreen">Fullscreen board</button></div><p id="board-note" role="status">Edit your setup below, then save it as a custom timer.</p><div id="specialty-board" class="specialty-board"></div><details class="timer-guide"><summary>How it works and advice</summary><div class="guide-content"><h2>Build a timer around your routine</h2><ol><li>Choose sequential slots, independent stopwatches or player time banks.</li><li>Name each slot and set its duration. Add preparation, rests or repeats under Advanced.</li><li>Choose start, end and warning signals per slot. Test sounds before your session.</li><li>Apply changes, then Save as custom timer. Sign in with Google for account synchronization.</li></ol><p>Drag a clock timeline to adjust its time. The timer stays paused after seeking. Fullscreen can show one clock or the whole board.</p><p>Keep the tab open for alarms. Browser background and locked-screen delivery is not guaranteed.</p></div></details>`}).replace('../special-timers.js?v=21','../specialty-board.js?v=2'));

const updated='2026-10-29'; // Change only when public page content meaningfully changes.
fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`\n  <url><loc>${url}</loc><lastmod>${updated}</lastmod></url>`).join('')}\n</urlset>\n`);
fs.writeFileSync(path.join(root,'robots.txt'),'User-agent: *\nAllow: /\nDisallow: /live.html\n\nUser-agent: OAI-SearchBot\nAllow: /\nDisallow: /live.html\n\nSitemap: https://corptimer.com/sitemap.xml\n');
fs.writeFileSync(path.join(root,'llms.txt'),'# CorpTimer\n\n> Free browser-based timers for meetings, focus, classrooms, workouts and everyday activities.\n\n## Public timer pages\n\n'+timers.map(t=>`- [${t.title}](https://corptimer.com/${t.slug?t.slug+'/':''}): ${t.description}`).join('\n')+'\n\n## Directory and usage\n\n- [Other Timers](https://corptimer.com/timers/): Browse all activities and preset countdowns.\n- Each timer page contains a public, expandable How it works and advice guide in its HTML.\n- JavaScript is required to operate the clocks; an account is not required.\n- Timer settings, custom timers, templates and favorites save locally, with optional Google account synchronization.\n- Keep the tab open for alarms; background and mobile delivery depend on the browser.\n- Live audience links are temporary session views, not indexable timer guides.\n');
const meetingFile=path.join(root,'index.html');
let meeting=fs.readFileSync(meetingFile,'utf8').replaceAll('special-timers.css?v=13','special-timers.css?v=21').replaceAll('timer-menu.js?v=13','timer-menu.js?v=21');
const meetingGuide=`<!-- timer-guide:start -->\n${renderTimerGuide(timers[0])}\n<!-- timer-guide:end -->\n`;
const guidePattern=/<!-- timer-guide:start -->[\s\S]*?<!-- timer-guide:end -->\n?/;
meeting=guidePattern.test(meeting)?meeting.replace(guidePattern,meetingGuide):meeting.replace('<footer class="app-footer">',meetingGuide+'<footer class="app-footer">');
if(!meeting.includes('name="robots"'))meeting=meeting.replace('<link rel="canonical"','<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">\n<link rel="canonical"');
const meetingMenu=`<!-- timer-menu:start -->${renderTimerMenu('','./')}<!-- timer-menu:end -->`;
const menuPattern=/<!-- timer-menu:start -->[\s\S]*?<!-- timer-menu:end -->/;
meeting=menuPattern.test(meeting)?meeting.replace(menuPattern,meetingMenu):meeting.replace('<a class="nav-link other-timers" href="./timers/">Other Timers</a>',meetingMenu);
if(!meeting.includes('src="./timer-menu.js'))meeting=meeting.replace('</body>','<script type="module" src="./timer-menu.js?v=21"></script>\n</body>');
if(!meeting.includes('src="./timer-favorites.js'))meeting=meeting.replace('</body>','<script type="module" src="./timer-favorites.js?v=2"></script></body>');
fs.writeFileSync(meetingFile,meeting);
console.log(`Generated ${timers.length-1} timer pages, directory, sitemap and robots.txt.`);

enhanceGuides();
