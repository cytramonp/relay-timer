import test from 'node:test';import assert from 'node:assert/strict';
import {access,startUse,DAY} from '../docs/pro-policy.js';
test('trial requires both ten days and ten starts',()=>{
 const first=Date.UTC(2026,0,1);let s={};for(let i=0;i<10;i++)s=startUse(s,`session_${i}`,first).state;
 assert.equal(access(s,first+9*DAY).tier,'trial');assert.equal(access(s,first+10*DAY).tier,'free');
 assert.equal(access({...s,uses:9},first+100*DAY).tier,'trial');assert.equal(access({},first+100*DAY).tier,'trial');
});
test('two free starts, idempotent resume, UTC day rollover',()=>{
 const now=Date.UTC(2026,1,1);let s={firstUsedAt:now-20*DAY,uses:10};
 let r=startUse(s,'session_one',now);s=r.state;assert(r.allowed);
 assert.equal(startUse(s,'session_one',now).state.uses,11);
 s=startUse(s,'session_two',now).state;assert.equal(startUse(s,'session_three',now).allowed,false);
 assert(startUse(s,'session_three',now+DAY).allowed);
});
test('provider entitlements expire and union across stores',()=>{
 const now=Date.now(),s={firstUsedAt:now-20*DAY,uses:10,providers:{stripe:{expiresAt:now-1},google:{expiresAt:now+1000}}};
 assert.equal(access(s,now).tier,'pro');assert.equal(access(s,now+1000).tier,'free');
});
test('invalid session identifiers are rejected',()=>assert.throws(()=>startUse({},'bad/path')));
test('prototype names cannot bypass an exhausted quota',()=>{
 const now=Date.now(),s={firstUsedAt:now-20*DAY,uses:10,day:new Date(now).toISOString().slice(0,10),dailyUses:2};
 assert.equal(startUse(s,'__proto__',now).allowed,false);assert.equal(startUse(s,'constructor',now).allowed,false);
});
