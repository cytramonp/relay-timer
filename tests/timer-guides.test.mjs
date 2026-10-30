import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {timers} from '../docs/timer-catalog.js';import{detailsFor}from'../scripts/guide-details.mjs';
const pages=[...timers,{slug:'custom-timer',kind:'custom',mode:'sequence'}];
const marks=JSON.parse(fs.readFileSync('docs/assets/guides/callouts.json','utf8'));
test('every timer guide has a numbered real screenshot, a worked example and valid callout positions',()=>{
 assert.equal(Object.keys(marks).length,pages.length);
 for(const t of pages){const key=t.slug||'meeting',m=marks[key],html=fs.readFileSync(`docs/${t.slug?t.slug+'/':''}index.html`,'utf8');
  assert.ok(m.items.length>=2,key);assert.ok(fs.existsSync('docs/assets/guides/'+m.image),key);assert.ok(fs.existsSync(`docs/assets/guides/${key}-annotated.svg`),key);
  for(const c of m.items){assert.ok(c.x>=0&&c.x<=m.width&&c.y>=0&&c.y<=m.height,key);assert.ok(c.label&&c.meaning,key);}
  for(const heading of ['Controls at a glance','Settings and saved setups','Example:','Saving, sound and browser limits'])assert.ok(html.includes(heading),key+': '+heading);
  for(const id of ['guide-setup','guide-controls','guide-example'])assert.ok(html.includes(`id="${id}"`),key+': '+id);
  assert.ok(!/do not use Google\/Firebase meeting synchronization|No agitation cues are included/.test(html),key);
 }
});
test('control references distinguish count-up, countdown and turn-based clocks',()=>{
 const stopwatch=detailsFor(timers.find(t=>t.kind==='stopwatch'));
 assert.ok(!stopwatch.controls.some(([n,v])=>/Start again|Next interval|countdown/.test(n+' '+v)));
 for(const t of timers.filter(t=>t.kind==='specialty')){
  const names=detailsFor(t).controls.map(r=>r[0]);assert.equal(names.includes('Lap'),t.mode==='up',t.slug);assert.equal(names.includes('Next player'),t.mode==='turn',t.slug);assert.equal(names.includes('Next stage'),t.mode==='sequence',t.slug);
 }
});
