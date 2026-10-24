const minute=60000;
const text=(value,max=500)=>typeof value==='string'?value.slice(0,max):'';
export const copyPlan=agenda=>agenda.map(({id,name,min,kind})=>({id,name,min,kind:kind==='topic'?'topic':'person'}));
export function cleanPlan(plan){if(!Array.isArray(plan)||plan.length>2000)return[];return plan.filter(a=>a&&typeof a.id==='string'&&/^[\w-]{1,100}$/.test(a.id)&&typeof a.name==='string'&&Number.isFinite(a.min)&&a.min>=0&&a.min<=1440).map(a=>({id:a.id,name:text(a.name,120),min:a.min,kind:a.kind==='topic'?'topic':'person'}));}
export function cleanParking(items){if(!Array.isArray(items))return[];return items.slice(0,2000).filter(x=>x&&typeof x.text==='string').map(x=>({id:typeof x.id==='string'&&/^[\w-]{1,100}$/.test(x.id)?x.id:crypto.randomUUID(),text:text(x.text),owner:text(x.owner,120),done:!!x.done,createdAt:Number.isFinite(x.createdAt)?x.createdAt:Date.now()}));}
export function cleanReports(reports){if(!Array.isArray(reports))return[];return reports.filter(r=>r&&Array.isArray(r.rows)&&r.rows.length<=2000&&Number.isFinite(r.startedAt)).map(r=>({...r,id:text(r.id,100),rows:r.rows.map(row=>({id:text(row.id,100),name:text(row.name,120),plannedMs:Math.max(0,Number(row.plannedMs)||0),actualMs:Math.max(0,Number(row.actualMs)||0),status:['completed','current','pending','skipped'].includes(row.status)?row.status:'pending'})),changes:Array.isArray(r.changes)?r.changes.slice(0,1000).map(c=>({at:Math.max(0,Number(c.at)||0),plan:cleanPlan(c.plan)})):[],parking:cleanParking(r.parking)}));}
export function elapsed(run,now=Date.now()){return !run?0:run.doneAt??Math.max(0,(run.pauseAt??now)-run.t0-run.pausedMs);}
export function dueAt(state,slot,start){let sum=0;for(const a of state.agenda){sum+=a.min*minute;if(a.id===slot)break;}return Math.max(sum,start+Math.max(0,state.floor||0)*minute);}
// Advance at the original deadline, even if a background tab wakes several slots late.
export function advanceAutomatic(state,now=Date.now()){
  const r=state.run;if(state.endPolicy!=='auto'||!r?.cur||r.pauseAt!=null)return false;
  const e=elapsed(r,now);let changed=false,guard=state.agenda.length+1;
  while(r.cur&&guard-->0){const end=dueAt(state,r.cur.id,r.cur.start);if(e<end)break;const c=r.cur;r.log.push({id:c.id,start:c.start,end,dl:end});const seen=new Set(r.log.map(l=>l.id));const next=state.agenda.find(a=>!seen.has(a.id));r.cur=next?{id:next.id,start:end}:null;if(!next)r.doneAt=end;changed=true;}
  return changed;
}
export function makeReport(state,now=Date.now()){
  const r=state.run;if(!r)return null;const plan=r.originalPlan?.length?r.originalPlan:copyPlan(state.agenda),e=elapsed(r,now),current=state.agenda;
  const historicalNames=new Map((r.planChanges||[]).flatMap(c=>c.plan).map(a=>[a.id,a.name]));const ids=[...new Set([...plan.map(a=>a.id),...current.map(a=>a.id),...r.log.map(l=>l.id)])];
  const rows=ids.map(id=>{const original=plan.find(a=>a.id===id),slot=current.find(a=>a.id===id),logs=r.log.filter(l=>l.id===id),active=r.cur?.id===id;return{id,name:original?.name||slot?.name||historicalNames.get(id)||'Removed slot',plannedMs:(original?.min||0)*minute,actualMs:logs.reduce((n,l)=>n+l.end-l.start,0)+(active?Math.max(0,e-r.cur.start):0),status:active?'current':logs.length?'completed':slot?'pending':'skipped'};});
  return{id:r.id||String(r.t0),startedAt:r.t0,finished:r.doneAt!=null,originalTotal:plan.reduce((n,a)=>n+a.min*minute,0),actualTotal:e,rows,changes:structuredClone(r.planChanges||[]),parking:cleanParking(state.parking)};
}
export function reportCSV(report,title='Meeting'){
  const cell=value=>{let s=String(value??'');if(typeof value==='string'&&(/^[\s]*[=+\-@]/.test(s)||/^[\t\r]/.test(s)))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  const rows=[['Meeting',title],['Started',new Date(report.startedAt).toISOString()],['Slot','Original plan (sec)','Actual (sec)','Difference (sec)','State'],...report.rows.map(r=>[r.name,r.plannedMs/1000,Math.round(r.actualMs/1000),r.status==='pending'?'':Math.round((r.actualMs-r.plannedMs)/1000),r.status]),[],['Plan edits','Revised agenda'],...(report.changes||[]).map(c=>[Math.round(c.at/1000)+' sec',c.plan.map(a=>a.name+' '+a.min+' min').join(' / ')]),[],['Parking lot','Owner','Done'],...(report.parking||[]).map(p=>[p.text,p.owner,p.done?'Yes':'No'])];return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
}
// Public projection deliberately omits notes, reports, Google profile and private library IDs.
export function liveProjection(state,title,now=Date.now()){
  const r=state.run,agenda=copyPlan(state.agenda),a=r?.cur?agenda.find(a=>a.id===r.cur.id):r?null:agenda[0];const seen=new Set(r?.log.map(l=>l.id)||[]),next=agenda.find(x=>x.id!==a?.id&&!seen.has(x.id));
  return{title:text(title,120),name:a?.name||(r?'Meeting complete':'Ready'),next:next?.name||'',status:r?.doneAt!=null?'done':r?.pauseAt!=null?'paused':r?'running':'ready',baseRemaining:r?.doneAt!=null?0:r?.cur?dueAt(state,a.id,r.cur.start)-elapsed(r,now):(a?.min||0)*minute,baseElapsed:elapsed(r,now),publishedAt:now,plannedTotal:agenda.reduce((s,a)=>s+a.min*minute,0),policy:state.endPolicy||'manual',agenda:agenda.map(({name,min,id})=>({name,min,status:r?.cur?.id===id?'current':seen.has(id)?'done':'next'}))};
}
