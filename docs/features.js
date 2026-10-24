import {makeReport,reportCSV,liveProjection} from './session.js?v=5';
import {formatTime} from './model.js?v=5';
import {loadCloud} from './cloud.js?v=5';
import qrcode from './vendor/qrcode.js';
const $=id=>document.getElementById(id),timer=window.relayTimer;
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
const fmt=ms=>formatTime(Math.abs(ms),'up'),signed=ms=>(ms>0?'+':ms<0?'−':'±')+fmt(ms);
const notice=message=>{const t=$('toast');t.textContent=message;t.hidden=false;clearTimeout(notice.timeout);notice.timeout=setTimeout(()=>t.hidden=true,6000);};
const download=(content,type,name)=>{const url=URL.createObjectURL(new Blob([content],{type})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
async function copy(text){try{await navigator.clipboard.writeText(text);notice('Copied.');}catch{notice('Clipboard unavailable. Use the displayed viewer link or export a file.');}}

// Private parking lot is part of the saved meeting, never the public projection.
function parking(){return timer.snapshot().parking||[];}
function editItem(id,values){timer.setParking(parking().map(item=>item.id===id?{...item,...values}:item));}
function renderParking(){const items=parking(),box=$('parking-list');box.replaceChildren();$('parking-count').textContent=items.filter(i=>!i.done).length;
  if(!items.length){box.append(el('p','parking-empty','Nothing parked yet. Add a tangent or a follow-up action.'));return;}
  for(const item of items){const row=el('div','parking-item'+(item.done?' is-done':'')),check=el('input');check.type='checkbox';check.checked=item.done;check.setAttribute('aria-label',`Mark ${item.text} ${item.done?'unfinished':'done'}`);check.onchange=()=>{editItem(item.id,{done:check.checked});renderParking();};
    const fields=el('div','parking-fields'),topic=el('input');topic.value=item.text;topic.maxLength=500;topic.setAttribute('aria-label','Parked topic');topic.onchange=()=>editItem(item.id,{text:topic.value.trim()||item.text});const owner=el('input');owner.value=item.owner;owner.maxLength=120;owner.placeholder='Assign an owner';owner.setAttribute('aria-label',`Owner for ${item.text}`);owner.onchange=()=>editItem(item.id,{owner:owner.value.trim()});fields.append(topic,owner);
    const remove=el('button','quiet','Remove');remove.setAttribute('aria-label',`Remove parked topic ${item.text}`);remove.onclick=()=>{timer.setParking(parking().filter(i=>i.id!==item.id));renderParking();};row.append(check,fields,remove);box.append(row);}
}
$('parking-form').onsubmit=e=>{e.preventDefault();const text=$('parking-text').value.trim();if(!text)return;timer.setParking([...parking(),{id:crypto.randomUUID(),text,owner:$('parking-owner').value.trim(),done:false,createdAt:Date.now()}]);e.target.reset();renderParking();$('parking-text').focus();};

let selectedReport='current';
function availableReports(){const state=timer.snapshot(),current=makeReport(state);return[...(current?[{...current,key:'current'}]:[]),...(state.reports||[]).slice().reverse().map(r=>({...r,key:r.id}))];}
function currentReport(){return availableReports().find(r=>r.key===selectedReport)||availableReports()[0];}
function renderReport(){const reports=availableReports(),select=$('report-session'),old=selectedReport;select.replaceChildren();for(const report of reports){const option=el('option','',`${report.key==='current'?'Current session':'Saved session'} · ${new Date(report.startedAt).toLocaleString()}`);option.value=report.key;select.append(option);}selectedReport=reports.find(r=>r.key===old)?.key||reports[0]?.key||'current';select.value=selectedReport;select.disabled=reports.length<2;
  const box=$('report-content'),r=currentReport();box.replaceChildren();for(const id of ['report-export','report-copy','report-print'])$(id).disabled=!r;
  if(!r){box.append(el('p','report-empty','Start a meeting to capture its original plan. Actual times and changes will appear here.'));return;}
  const total=el('div','report-overview');total.append(el('p','',`Original plan: ${fmt(r.originalTotal)} · Actual: ${fmt(r.actualTotal)}`),el('p','section-note',r.finished?'Completed session':'Session in progress · times shown so far'));
  if(!timer.snapshot().run?.originalPlan?.length&&r.key==='current')total.append(el('p','section-note','This session started before original-plan tracking. Its baseline is the current agenda.'));
  box.append(total);const scroll=el('div','report-table-wrap'),table=el('table','report-table'),head=el('thead'),hr=el('tr');for(const t of ['Slot','Original plan','Actual','Difference'])hr.append(el('th','',t));head.append(hr);table.append(head);const body=el('tbody');
  for(const row of r.rows){const tr=el('tr');tr.append(el('th','',row.name),el('td','',fmt(row.plannedMs)),el('td','',row.status==='pending'||row.status==='skipped'?'—':fmt(row.actualMs)),el('td',row.actualMs>row.plannedMs?'time-over':'',row.status==='pending'||row.status==='skipped'?row.status:signed(row.actualMs-row.plannedMs)));body.append(tr);}table.append(body);scroll.append(table);box.append(scroll);
  const changes=el('section','report-changes');changes.append(el('h3','',`Plan changes · ${r.changes.length}`));if(!r.changes.length)changes.append(el('p','section-note','The agenda has not changed since the session started.'));for(const change of r.changes){changes.append(el('p','',`At ${fmt(change.at)} · ${change.plan.map(a=>`${a.name} ${fmt(a.min*60000)}`).join(' / ')}`));}box.append(changes);
}
$('report-open').onclick=()=>{renderReport();$('report-dialog').showModal();};$('report-session').onchange=e=>{selectedReport=e.target.value;renderReport();};
$('report-export').onclick=()=>{const r=currentReport();if(r)download(reportCSV(r,$('meeting-title').value),'text/csv;charset=utf-8','relay-timer-report.csv');};
$('report-copy').onclick=()=>{const r=currentReport();if(r)copy(`${$('meeting-title').value}\nOriginal plan ${fmt(r.originalTotal)} · Actual ${fmt(r.actualTotal)}\n${r.rows.map(row=>`${row.name}: ${fmt(row.plannedMs)} planned / ${row.status==='pending'?'pending':fmt(row.actualMs)+' actual'}`).join('\n')}`);};
$('report-print').onclick=()=>window.print();
setInterval(()=>{if($('report-dialog').open)renderReport();},1000);

// Live links share an intentionally small public document, not a meeting/library record.
const hostKey='relay.live.host.v1';let host=null,service=null,offCommands=null,publishTimer,heartbeat,lastCommand='';const handled=new Set();
const hex=bytes=>Array.from(crypto.getRandomValues(new Uint8Array(bytes)),b=>b.toString(16).padStart(2,'0')).join('');
const urls=()=>{const url=new URL('./live.html',location.href);url.hash=`room=${host.id}`;const viewer=url.href;url.hash+=`&control=${host.token}`;return{viewer,control:url.href};};
const setShare=text=>$('share-state').textContent=text;
async function cloud(){return service ||= await loadCloud(()=>{},error=>setShare(error.message||'Live sharing needs a connection.'));}
function shareUI(){const active=!!host;$('share-active').hidden=!active;$('share-create').hidden=active;$('share-open').classList.toggle('is-live',active);if(!host)return;const {viewer}=urls();$('viewer-url').value=viewer;const qr=qrcode(0,'M');qr.addData(viewer);qr.make();$('share-qr').innerHTML=qr.createSvgTag({cellSize:4,margin:16,scalable:true});$('share-qr').querySelector('svg').setAttribute('role','img');$('share-qr').querySelector('svg').setAttribute('aria-label','Scan to open the viewer timer');}
let publishing=false,dirty=false,lastPulse=0;
function publish(){
  if(!host||host.stopping||host.meetingId!==document.body.dataset.meetingId)return;
  dirty=true;if(publishing)return;publishing=true;lastPulse=Date.now();const current=host;
  (async()=>{while(dirty&&host===current&&!host.stopping&&host.meetingId===document.body.dataset.meetingId){
    dirty=false;lastPulse=Date.now();if(Date.now()>=host.expiresAt){await stop();setShare('The live link expired. Create a new link.');return;}
    await service.publishRoom(current.id,{...liveProjection(timer.snapshot(),$('meeting-title').value),lastCommand});
    setShare('Live · keep this host tab open. Notes and reports stay private.');
  }})().catch(()=>setShare('Connection interrupted. The audience will see a stale-connection warning. Reconnect or stop sharing.')).finally(()=>publishing=false);
}
function schedulePublish(){clearTimeout(publishTimer);if(host)publishTimer=setTimeout(publish,400);}
function watchCommands(){offCommands?.();offCommands=service.watchCommands(host.id,async(id,command)=>{const current=host;if(!current||handled.has(id))return;handled.add(id);if(Date.now()-command.at<30000&&Date.now()-command.at>-30000&&['next','pause','undo','extend'].includes(command.action)){timer.command(command.action);lastCommand=id;publish();}try{await service.clearCommand(current.id,id);}catch{}},()=>setShare('Remote control disconnected. Reconnect or create a new live link.'));}
function startHeartbeat(){clearInterval(heartbeat);heartbeat=setInterval(publish,15000);watchCommands();}
async function stop(){if(!host)return;const previous=host;host.stopping=true;clearInterval(heartbeat);clearTimeout(publishTimer);offCommands?.();offCommands=null;try{await service.endRoom(previous.id);}catch(error){host.stopping=false;throw error;}host=null;lastCommand='';sessionStorage.removeItem(hostKey);shareUI();setShare('Sharing stopped. Both links are revoked.');}
window.relayLive={stop};
$('share-open').onclick=()=>{shareUI();$('share-dialog').showModal();};
$('share-start').onclick=async()=>{const button=$('share-start');button.disabled=true;setShare('Creating a live screen…');try{const api=await cloud(),id=hex(16),token=hex(32),data=await api.createRoom(id,token,liveProjection(timer.snapshot(),$('meeting-title').value));host={id,token,...data,meetingId:document.body.dataset.meetingId};sessionStorage.setItem(hostKey,JSON.stringify(host));startHeartbeat();shareUI();setShare('Live · keep this host tab open. Links expire in 24 hours.');}catch{setShare('Could not create a live link. Check your connection and try again. Your local timer still works.');}finally{button.disabled=false;}};
$('viewer-copy').onclick=()=>host&&copy(urls().viewer);$('controller-copy').onclick=()=>host&&copy(urls().control);$('viewer-open').onclick=()=>host&&window.open(urls().viewer,'_blank','noopener');$('controller-open').onclick=()=>host&&window.open(urls().control,'_blank','noopener');
$('share-stop').onclick=async()=>{const b=$('share-stop');b.disabled=true;try{await stop();}catch{setShare('Could not revoke the links yet. Reconnect and try Stop sharing again.');}finally{b.disabled=false;}};
document.addEventListener('relay:tick',()=>{if(host&&Date.now()-lastPulse>=15000)publish();});document.addEventListener('relay:change',schedulePublish);$('meeting-title').addEventListener('input',schedulePublish);
document.addEventListener('relay:meeting',async()=>{renderParking();if(host&&host.meetingId!==document.body.dataset.meetingId){try{await stop();notice('Live sharing stopped when you switched meetings.');}catch{setShare('The old live link could not be revoked. Reconnect and stop sharing before creating another link.');}}});
try{const saved=JSON.parse(sessionStorage.getItem(hostKey));if(saved?.expiresAt>Date.now()&&saved.meetingId===document.body.dataset.meetingId){host=saved;cloud().then(api=>api.roomAuth()).then(uid=>{if(uid!==host.uid)throw Error('Host account changed.');startHeartbeat();publish();shareUI();}).catch(()=>{host=null;sessionStorage.removeItem(hostKey);shareUI();setShare('The previous live link could not reconnect. It expires automatically.');});}}catch{}
renderParking();
