import test from 'node:test';
import assert from 'node:assert/strict';
import {presets} from '../docs/presets.js';
import {makeTemplate,reviseTemplate,freshPlan,isTemplate,isMeeting} from '../docs/templates.js';
import {mergeRecords,parseBackup,removeRecord,makeRecord} from '../docs/storage.js';

test('templates keep a reusable plan and settings without private session data',()=>{
  const source=presets.daily().state;
  source.parking=[{id:'private-note',text:'Private tangent',owner:'Private owner',done:false}];
  source.run={t0:1000,pausedMs:0,pauseAt:2000,cur:{id:source.agenda[0].id,start:0},log:[]};
  const template=makeTemplate('Team ritual',source,{color:'lilac',icon:'loop'});
  assert.ok(isTemplate(template));assert.equal(isMeeting(template),false);
  assert.equal(template.state.run,null);assert.deepEqual(template.state.parking,[]);assert.deepEqual(template.state.reports,[]);
  assert.deepEqual(template.state.template,{color:'lilac',icon:'loop'});
  assert.equal(template.state.autoSplit,source.autoSplit);assert.equal(source.parking.length,1);
});
test('applying a template creates independent slots and never alters its saved plan',()=>{
  const saved=makeTemplate('Focus ritual',presets.focus().state,{color:'mint',icon:'focus'});
  const first=freshPlan(saved.state),second=freshPlan(saved.state);
  assert.equal(first.template,undefined);assert.notEqual(first.agenda[0].id,second.agenda[0].id);
  first.agenda[0].name='Edited live';first.agenda[0].min=45;
  assert.equal(saved.state.agenda[0].name,'Focus');assert.equal(saved.state.agenda[0].min,25);
});
test('custom templates survive backup and newest-record sync with meeting isolation',()=>{
  const saved=makeTemplate('Team ritual',presets.daily().state,{color:'peach',icon:'people'});
  const edited=reviseTemplate(saved,'Monday ritual',presets.retro().state,{color:'mint',icon:'loop'});
  const meeting=makeRecord('Monday meeting',freshPlan(saved.state));
  const restored=parseBackup(JSON.stringify({meetings:[saved,meeting]}));
  const merged=mergeRecords(restored,[edited]);
  assert.equal(merged.filter(isMeeting).length,1);assert.equal(merged.filter(isTemplate).length,1);
  assert.equal(merged.find(isTemplate).title,'Monday ritual');assert.equal(edited.id,saved.id);
  assert.ok(edited.updatedAt>saved.updatedAt);
  assert.equal(mergeRecords(merged,[removeRecord(edited)]).filter(r=>!r.deleted&&isTemplate(r)).length,0);
});
test('template appearance accepts only supported tokens and positive agenda totals',()=>{
  const saved=makeTemplate('<script>',presets.daily().state,{color:'url(bad)',icon:'<svg>'});
  assert.deepEqual(saved.state.template,{color:'citron',icon:'grid'});
  assert.throws(()=>makeTemplate('Empty',{agenda:[]}));
});
