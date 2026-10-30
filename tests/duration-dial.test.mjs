import test from 'node:test';
import assert from 'node:assert/strict';
import {dialDelta,dialValue} from '../docs/duration-dial.js';
test('dial direction remains continuous across the angular seam',()=>{
 const rad=d=>d*Math.PI/180;
 assert.ok(Math.abs(dialDelta(rad(179),rad(-179))-rad(2))<1e-10);
 assert.ok(Math.abs(dialDelta(rad(-179),rad(179))-rad(-2))<1e-10);
 assert.equal(dialDelta(-Math.PI/2,0),Math.PI/2);
});
test('dial preserves fractional minute steps and respects duration bounds',()=>{
 assert.equal(dialValue(3,1,.25,0,60),3.25);
 assert.equal(dialValue(3.25,-1,.25,0,60),3);
 assert.equal(dialValue(1,-20,1,0,60),0);
 assert.equal(dialValue(59,10,1,0,60),60);
 assert.equal(dialValue(0,3,.1,0,60),.3);
});
