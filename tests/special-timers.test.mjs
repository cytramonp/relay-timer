import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildSequence, IntervalClock, ChessClock, newYearTarget, formatTime } from '../docs/timer-engine.js';
import { defaults } from '../docs/timer-forms.js';
import { timers } from '../docs/timer-catalog.js';
import { guideFor } from '../docs/timer-guides.js';

test('boxing uses per-round work/rest and omits rest after the last round',()=>{
  const seq=buildSequence('boxing',{...defaults.boxing,prepare:5,cooldown:20,customRounds:true,overrides:[{name:'Technique',work:90,rest:30},{name:'Power',work:120,rest:45},{name:'Finish',work:60,rest:60}]});
  assert.deepEqual(seq.map(s=>[s.name,s.ms]),[['Get ready',5000],['Technique',90000],['Rest',30000],['Power',120000],['Rest',45000],['Finish',60000],['Cool down',20000]]);
});
test('fitness substitutes set recovery at set boundaries, with no final recovery',()=>{
  const seq=buildSequence('fitness',{...defaults.fitness,rounds:2,sets:2,prepare:0,work:20,rest:10,setRest:60});
  assert.deepEqual(seq.map(s=>[s.type,s.ms,s.set]),[['work',20000,1],['rest',10000,1],['work',20000,1],['rest',60000,1],['work',20000,2],['rest',10000,2],['work',20000,2]]);
});
test('Pomodoro long breaks follow the session frequency and final break choice',()=>{
  const config={...defaults.pomodoro,rounds:4,longEvery:2};
  assert.deepEqual(buildSequence('pomodoro',config).map(s=>s.ms),[1500000,300000,1500000,900000,1500000,300000,1500000,900000]);
  assert.equal(buildSequence('pomodoro',{...config,finalBreak:false}).length,7);
});
test('interval clock catches up over several stages after a background gap',()=>{
  const clock=new IntervalClock([{ms:1000},{ms:2000},{ms:3000}]);clock.start(10000);clock.update(14500);
  assert.equal(clock.index,2);assert.equal(clock.remaining(),1500);clock.update(16000);assert.equal(clock.done,true);assert.equal(clock.running,false);
});
test('pausing excludes the paused interval and a restored session is paused',()=>{
  const seq=[{ms:10000}];const clock=new IntervalClock(seq);clock.start(0);clock.pause(1500);clock.update(50000);assert.equal(clock.remaining(),8500);
  clock.start(50000);clock.update(51000);const restored=new IntervalClock(seq);restored.restore(clock.snapshot());assert.equal(restored.remaining(),7500);assert.equal(restored.running,false);
});
test('manual transitions wait at zero without consuming the following round',()=>{
  const clock=new IntervalClock([{ms:1000},{ms:2000}],false);clock.start(0);clock.update(10000);
  assert.equal(clock.index,0);assert.equal(clock.waiting,true);assert.equal(clock.running,false);assert.equal(clock.remaining(),0);
  clock.next(12000);clock.start(12000);clock.update(13000);assert.equal(clock.index,1);assert.equal(clock.remaining(),1000);
});
test('a one-minute extension changes only the current interval',()=>{
  const clock=new IntervalClock([{ms:1000},{ms:2000}]);clock.start(0);clock.update(500);clock.extend(60000);assert.equal(clock.remaining(),60500);assert.equal(clock.sequence[1].ms,2000);
});
test('chess increments the player completing a move and stops on a flag',()=>{
  const clock=new ChessClock(10,2);clock.start(1000);clock.switch(4000);assert.deepEqual(clock.times,[9000,10000]);assert.deepEqual(clock.moves,[1,0]);assert.equal(clock.active,1);
  assert.equal(clock.switch(15000),false);assert.equal(clock.flag,1);assert.equal(clock.running,false);assert.equal(clock.active,1);assert.equal(clock.times[1],0);
});
test('chess delay is preserved on pause and restarts only after switching',()=>{
  const clock=new ChessClock(10,0,3);clock.start(0);clock.pause(1000);assert.equal(clock.delayLeft,2000);assert.equal(clock.times[0],10000);
  clock.start(10000);clock.update(13000);assert.equal(clock.times[0],9000);clock.switch(13000);assert.equal(clock.delayLeft,3000);assert.equal(clock.active,1);
});
test('New Year uses actual midnight in each selected zone and the next local year',()=>{
  const now=Date.parse('2026-10-26T12:00:00Z');
  assert.equal(newYearTarget(now,'UTC').target,Date.parse('2027-01-01T00:00:00Z'));
  assert.equal(newYearTarget(now,'America/New_York').target,Date.parse('2027-01-01T05:00:00Z'));
  assert.equal(newYearTarget(now,'Asia/Dubai').target,Date.parse('2026-12-31T20:00:00Z'));
  assert.equal(newYearTarget(now,'Australia/Sydney').target,Date.parse('2026-12-31T13:00:00Z'));
  assert.equal(newYearTarget(Date.parse('2026-12-31T22:00:00Z'),'Asia/Dubai').year,2028);
});
test('countdowns round up and stopwatch tenths round down',()=>{
  assert.equal(formatTime(1001),'0:02');assert.equal(formatTime(1999,true),'0:01.9');assert.equal(formatTime(3600000),'1:00:00');assert.equal(formatTime(-10),'0:00');
});
test('every timer has a crawlable page, unique canonical, correct preset and working local links',()=>{
  const docs=path.resolve('docs');const titles=new Set();const canonicals=new Set();
  for(const timer of timers.filter(t=>t.slug)){
    const filename=path.join(docs,timer.slug,'index.html');const html=fs.readFileSync(filename,'utf8');
    assert.ok(html.includes(`<h1>${timer.title}</h1>`),timer.slug);
    const title=html.match(/<title>(.*?)<\/title>/)[1];assert.ok(!titles.has(title));titles.add(title);
    const canonical=html.match(/rel="canonical" href="([^"]+)"/)[1];assert.equal(canonical,`https://corptimer.com/${timer.slug}/`);assert.ok(!canonicals.has(canonical));canonicals.add(canonical);
    assert.ok(html.includes(guideFor(timer).paragraphs[0]));if(timer.minutes)assert.ok(html.includes(`>${timer.minutes}:00</div>`));
    for(const id of ['timer-settings','save-setup','saved-presets','delete-setup','export-setup','import-setup','fullscreen-timer','runtime-note'])assert.ok(html.includes(`id="${id}"`),`${timer.slug}: missing required control ${id}`);
    for(const [,href]of html.matchAll(/(?:href|src)="([^"]+)"/g)){
      if(/^(?:https?:|#)/.test(href))continue;const clean=href.split(/[?#]/)[0];const target=path.resolve(path.dirname(filename),clean.endsWith('/')?clean+'index.html':clean);assert.ok(fs.existsSync(target),`${timer.slug}: ${href}`);
    }
  }
  const root=fs.readFileSync(path.join(docs,'index.html'),'utf8');assert.ok(root.includes('Other Timers'));assert.ok(!root.includes('help-open'));assert.ok(!root.includes('help-dialog'));
  const sitemap=fs.readFileSync(path.join(docs,'sitemap.xml'),'utf8');for(const canonical of canonicals)assert.ok(sitemap.includes(canonical));assert.ok(!sitemap.includes('live.html'));
});
test('all fifteen timers contain a closed, static, page-specific how-to and advice guide',()=>{
  const unique=new Set();
  for(const timer of timers){
    const html=fs.readFileSync(timer.slug?`docs/${timer.slug}/index.html`:'docs/index.html','utf8');
    const guide=html.match(/<details class="timer-guide">([\s\S]*?)<\/details>/)?.[1];
    assert.ok(guide,timer.title);assert.ok(guide.includes('<summary>How it works and advice'));assert.ok(guide.includes(`<h2>How the ${timer.title} works</h2>`));assert.ok((guide.match(/<li>/g)||[]).length>=4);assert.ok(!unique.has(guide));unique.add(guide);
    assert.ok(!html.includes('<details class="timer-guide" open'));assert.ok(html.includes('name="robots" content="index,follow'));
  }
  const robots=fs.readFileSync('docs/robots.txt','utf8');assert.ok(robots.includes('User-agent: OAI-SearchBot'));assert.ok(robots.includes('Sitemap: https://corptimer.com/sitemap.xml'));
  const llms=fs.readFileSync('docs/llms.txt','utf8');for(const timer of timers)assert.ok(llms.includes(`https://corptimer.com/${timer.slug?timer.slug+'/':''}`));
});
