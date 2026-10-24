import {normalizeState} from './model.js?v=5';
import {makeRecord} from './storage.js?v=5';

export const templateColors=['citron','peach','lilac','mint'];
export const templateIcons=['people','loop','grid','spark','focus','coffee'];
export const isTemplate=record=>!!record?.state?.template;
export const isMeeting=record=>!record.deleted&&!isTemplate(record);

// Reusable plans carry settings, never session history or private follow-ups.
export function freshPlan(input){
  const source=structuredClone(input);
  delete source.template;source.run=null;source.parking=[];source.reports=[];
  source.agenda=source.agenda.map(a=>({...a,id:crypto.randomUUID()}));
  return normalizeState(source);
}
export function makeTemplate(title,input,appearance={}){
  const state=freshPlan(input);state.template={color:appearance.color,icon:appearance.icon};
  return makeRecord(title,normalizeState(state));
}
export function reviseTemplate(record,title,input,appearance){
  const next=makeTemplate(title,input,appearance);
  return {...next,id:record.id,updatedAt:Math.max(Date.now(),record.updatedAt+1)};
}
