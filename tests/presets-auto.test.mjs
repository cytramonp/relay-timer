import test from 'node:test';
import assert from 'node:assert/strict';
import {presets} from '../docs/presets.js';
import {normalizeState} from '../docs/model.js';
import {advanceAutomatic} from '../docs/session.js';
test('Pomodoro survives normalization and crosses focus, break and final boundaries',()=>{
 const s=normalizeState(presets.pomodoro().state);
 s.run={t0:1000,pausedMs:0,pauseAt:null,cur:{id:s.agenda[0].id,start:0},log:[]};
 assert.equal(advanceAutomatic(s,1000+25*60000-1),false);
 advanceAutomatic(s,1000+25*60000);assert.equal(s.run.cur.id,s.agenda[1].id);
 advanceAutomatic(s,1000+30*60000);assert.equal(s.run.cur.id,s.agenda[2].id);
 advanceAutomatic(s,1000+130*60000);assert.equal(s.run.cur,null);assert.equal(s.run.log.length,8);assert.equal(s.run.doneAt,130*60000);
});
test('Countdown completes automatically at its configured deadline',()=>{
 const s=normalizeState(presets.countdown().state);
 s.run={t0:1000,pausedMs:0,pauseAt:null,cur:{id:s.agenda[0].id,start:0},log:[]};
 advanceAutomatic(s,601000);assert.equal(s.run.cur,null);assert.equal(s.run.doneAt,600000);
});
