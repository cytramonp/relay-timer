import test from 'node:test';import assert from 'node:assert/strict';
import {themeDefaults,scheduleForServing} from '../docs/timer-themes.js';
import {specialtyTimers} from '../docs/specialty-catalog.js';
import {byPopularity} from '../docs/timer-popularity.js';
import {timers} from '../docs/timer-catalog.js';
import {createBoard,act,settle} from '../docs/board-engine.js';
test('kitchen serving planner offsets independent dishes to one completion time',()=>{
 const p=themeDefaults(specialtyTimers.find(t=>t.slug==='kitchen-timer'));const target=2000000,planned=scheduleForServing(p.cards,target,0);
 assert.equal(new Set(planned.map(c=>c.scheduledAt+c.stages.reduce((n,s)=>n+s.seconds,0)*1000)).size,1);
 assert.ok(planned.every(c=>c.scheduledAt+c.stages.reduce((n,s)=>n+s.seconds,0)*1000===target));
 assert.notEqual(planned[0].scheduledAt,planned[1].scheduledAt);assert.equal(p.cards[0].scheduledAt,undefined);
 assert.throws(()=>scheduleForServing(p.cards,1000,0));
});
test('tea waits at the end of each infusion rather than starting the next pour',()=>{
 const p=themeDefaults(specialtyTimers.find(t=>t.slug==='tea-brewing-timer'));let b=createBoard(p).map(c=>({...c,automatic:p.automatic}));
 b=act(b,0,'toggle','sequence',0);const c=settle(b[0],'sequence',181000);assert.equal(c.waiting,true);assert.equal(c.index,0);assert.equal(c.anchor,null);
});
test('seven themed routes have distinct usable profiles and breathing repeats complete cycles',()=>{
 const slugs=['kitchen-timer','meditation-timer','tea-brewing-timer','toothbrushing-timer','breathing-timer','yoga-stretching-timer','speech-timer'];
 for(const slug of slugs){const p=themeDefaults(specialtyTimers.find(t=>t.slug===slug));assert.ok(p.stages.length);assert.ok(p.stages.every(s=>s.seconds>=0));}
 const p=themeDefaults(specialtyTimers.find(t=>t.slug==='breathing-timer'));assert.equal(p.stages.length,24);assert.equal(p.stages.reduce((n,s)=>n+s.seconds,0),120);
});
test('popular activities sort deterministically without dropping any timer',()=>{
 const activities=timers.filter(t=>!t.minutes),sorted=[...activities].sort(byPopularity);
 assert.deepEqual(sorted.slice(0,2).map(t=>t.slug),['simple-timer','stopwatch']);assert.equal(new Set(sorted.map(t=>t.slug)).size,activities.length);
 assert.ok(sorted.findIndex(t=>t.slug==='kitchen-timer')<sorted.findIndex(t=>t.slug==='skydiving-ground-timer'));
});
