import test from 'node:test';
import assert from 'node:assert/strict';
import {equalizedAgenda} from '../docs/model.js';
const topics=[{id:'a',name:'Opening',kind:'topic',min:4},{id:'b',name:'Discussion',kind:'topic',min:8},{id:'c',name:'Close',kind:'topic',min:3}];
test('Equal times works on an all-topic template and leaves the source untouched',()=>{
  const next=equalizedAgenda(topics,null,15);assert.deepEqual(next.map(a=>a.min),[5,5,5]);assert.deepEqual(topics.map(a=>a.min),[4,8,3]);
});
test('explicit equalization includes speakers, topics and manually pinned slots',()=>{
  const agenda=topics.map((a,i)=>({...a,kind:i===1?'person':'topic',pin:true}));
  const next=equalizedAgenda(agenda,null,15);assert.deepEqual(next.map(a=>a.min),[5,5,5]);assert.ok(next.every(a=>!a.pin));
});
test('active sessions freeze completed slots, equalizing current and later slots only',()=>{
  const run={cur:{id:'b'},log:[{id:'a'}]};const next=equalizedAgenda(topics,run,15);
  assert.deepEqual(next.map(a=>a.min),[4,5.5,5.5]);assert.equal(next.reduce((sum,a)=>sum+a.min,0),15);
});
test('quarter-minute remainders preserve the exact total and finished plans are editable',()=>{
  const next=equalizedAgenda(topics,{cur:null,doneAt:100,log:[{id:'a'},{id:'b'},{id:'c'}]},10);
  assert.deepEqual(next.map(a=>a.min),[3.5,3.25,3.25]);assert.equal(next.reduce((sum,a)=>sum+a.min,0),10);
});
