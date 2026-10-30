import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createBoard,act,settle,seekCard} from '../docs/board-engine.js';
import {IntervalClock,buildSequence} from '../docs/timer-engine.js';
import {defaults} from '../docs/timer-forms.js';
import {intervalCue} from '../docs/interval-cues.js';
import {writeSetting,readSetting,selectAccount,receiveSetting,localSettings} from '../docs/timer-store.js';

test('manual boards stop at boundary; next and seek preserve independent clocks',()=>{
 let b=createBoard({count:2,stages:[{name:'Work',seconds:3},{name:'Rest',seconds:2}]}).map(c=>({...c,automatic:false}));
 b=act(b,0,'toggle','sequence',1000);const c=settle(b[0],'sequence',9000);
 assert.equal(c.waiting,true);assert.equal(c.index,0);assert.equal(c.elapsed,3000);assert.equal(c.anchor,null);
 b[0]=c;b=act(b,0,'next','sequence',10000);assert.equal(b[0].index,1);assert.equal(b[0].waiting,false);
 const sought=seekCard(b[0],1,'sequence');assert.equal(sought.index,0);assert.equal(sought.elapsed,1000);assert.equal(sought.anchor,null);assert.equal(b[1].elapsed,0);
 assert.equal(seekCard(b[0],5,'sequence').done,true);
});
test('boxing emits gong at work/rest and rest/work boundaries and respects independent mute',()=>{
 const config={...defaults.boxing,prepare:0,work:3,rest:2,rounds:2,warning:0,finalCue:0};
 const clock=new IntervalClock(buildSequence('boxing',config));clock.start(1000);
 const prev={index:clock.index,remaining:clock.remaining(),done:false};clock.update(4000);
 assert.equal(clock.sequence[clock.index].type,'rest');assert.equal(intervalCue(clock,prev,config,-1),'gong');
 assert.equal(intervalCue(clock,prev,{...config,gong:false},-1),null);
 assert.equal(intervalCue(clock,prev,{...config,sound:'off'},-1),null);
 const rest={index:clock.index,remaining:clock.remaining(),done:false};clock.update(6000);
 assert.equal(clock.sequence[clock.index].type,'work');assert.equal(intervalCue(clock,rest,config,-1),'gong');
 const last={index:clock.index,remaining:clock.remaining(),done:false};clock.update(9000);
 assert.equal(intervalCue(clock,last,config,-1),'gong');
 const wav=fs.readFileSync(new URL('../docs/assets/gong.wav',import.meta.url));assert.equal(wav.toString('ascii',0,4),'RIFF');
 let energy=0;for(let i=44;i+1<wav.length;i+=2)energy+=(wav.readInt16LE(i)/32768)**2;
 assert.ok(Math.sqrt(energy/((wav.length-44)/2))>.01,'gong must contain audible non-silent PCM');
});
test('settings merge by revision and isolate account switches without uploading another account',()=>{
 const storage={};Object.defineProperties(storage,{getItem:{value:k=>storage[k]??null},setItem:{value:(k,v)=>storage[k]=String(v)},removeItem:{value:k=>delete storage[k]}});
 globalThis.localStorage=storage;globalThis.window=new EventTarget();globalThis.CustomEvent=class extends Event{constructor(type,options){super(type);this.detail=options.detail;}};
 writeSetting('corptimer.custom.demo',{title:'Guest timer'});selectAccount('alice');
 writeSetting('corptimer.custom.demo',{title:'Alice timer'});const own=localSettings()[0];
 assert.equal(receiveSetting({...own,value:'{"title":"old"}',updatedAt:1}),false);
 assert.equal(receiveSetting({...own,value:'{"title":"remote"}',updatedAt:Date.now()+1000}),true);
 selectAccount('bob');assert.equal(readSetting('corptimer.custom.demo'),null);assert.equal(localSettings().length,0);
 writeSetting('corptimer.custom.bob',{title:'Bob timer'});selectAccount('alice');assert.equal(readSetting('corptimer.custom.demo').title,'remote');assert.equal(readSetting('corptimer.custom.bob'),null);
 selectAccount(null);assert.equal(readSetting('corptimer.custom.demo').title,'Guest timer');
});
