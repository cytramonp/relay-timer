import {stageTick} from './transition-sound.js';
import {timerArt} from './timer-art.js';
import { specialtyTimers } from './specialty-catalog.js';
import { createBoard, act, settle, display, elapsed, seekCard } from './board-engine.js';
import { readSetting, writeSetting } from './timer-store.js';
import { mountEditor, escape } from './board-editor.js';
import { CuePlayer } from './cue-player.js';
import { createTimeline } from './timer-timeline.js';
import { toggleFullscreen } from './fullscreen.js';
const slug=document.body.dataset.timerSlug,custom=slug==='custom-timer';
let customId=new URLSearchParams(location.search).get('id');
if(customId&&!/^[a-zA-Z0-9-]{1,80}$/.test(customId))customId=null;
const generic={slug,title:'My timer',mode:'sequence',count:1,stages:[{name:'Focus',seconds:300},{name:'Break',seconds:60,color:'rest'}],sound:false,volume:65};
const original=custom?readSetting('corptimer.custom.'+customId,generic):specialtyTimers.find(t=>t.slug===slug);
let profile={...original,...readSetting('corptimer.options.'+(customId||slug),{})};
profile.stages=profile.stages.map(s=>({color:/rest|recover|break/i.test(s.name)?'rest':'work',...s}));
profile.sound??=profile.category==='Sports'||slug==='egg-timer';
if(slug==='egg-timer')profile.stages=profile.stages.map(s=>({...s,warning:0,cueEnd:'bell'}));profile.volume??=65;
if(slug==='coffee-brewing-timer')profile.stages=profile.stages.map((s,i)=>({...s,note:s.note||['Bloom · pour to 50 g','Pour to 250 g','Let the coffee drain','Finish'][i%4]}));
if(slug==='darkroom-timer')profile.stages=profile.stages.map((s,i)=>({...s,repeatCue:s.repeatCue??(i===0?30:0)}));
if(slug==='sailing-start-timer')profile.stages=profile.stages.map(s=>({...s,cueEnd:s.cueEnd||'horn'}));
const root=document.querySelector('#specialty-board'),note=document.querySelector('#board-note'),audio=new CuePlayer();
const storageKey=()=>`corptimer.board.${customId||slug}`;
const fresh=()=>(profile.cards||createBoard(profile)).map((c,i)=>{
 const prefix=slug==='swimming-timer'?'Lane':slug==='running-coach-timer'?'Runner':slug==='climbing-timer'?'Climber':slug==='laboratory-timer'?'Sample':slug==='bakery-timer'||slug==='darkroom-timer'?'Batch':slug==='exam-station-timer'?'Station':slug==='escape-room-timer'?'Room':profile.mode==='turn'?'Player':'Timer';
 const result={...c,name:profile.cards?c.name:`${prefix} ${i+1}`,index:0,elapsed:0,anchor:null,laps:[],done:false,waiting:false,automatic:profile.automatic};
 if(slug==='sports-scoreboard-timer'){const roles=[['Game',1200],['Attack',24],['Timeout',60],['Penalty',120]],r=roles[i%4];result.name=r[0];result.stages=[{name:r[0],seconds:r[1],warning:10}];}
 return result;
});
let board=fresh(),timelines=[],lastSeconds=[];
const saved=readSetting(storageKey());
if(Array.isArray(saved)&&saved.length&&saved.length<=12&&saved.every(c=>typeof c.name==='string'&&Array.isArray(c.stages)&&c.stages.length&&c.stages.every(s=>typeof s.name==='string'&&Number.isFinite(s.seconds)&&s.seconds>=0)&&Number.isInteger(c.index)&&c.index>=0&&c.index<c.stages.length&&Number.isFinite(c.elapsed)&&Array.isArray(c.laps)))board=saved.map(c=>({...c,anchor:null}));
function save(localOnly=false){if(!writeSetting(storageKey(),board.map(c=>({...c,elapsed:elapsed(c,Date.now()),anchor:null})),{localOnly}))note.textContent='Storage is unavailable. Export your results before closing.';}
function configSave(){writeSetting('corptimer.options.'+(customId||slug),profile);if(customId)writeSetting('corptimer.custom.'+customId,profile);}
async function arm(){if(!profile.sound)return;try{await audio.arm();}catch{note.textContent='Sound could not load. Check your connection and toggle sound to try again.';}}
let lastCueAt=0;function cue(name){if(profile.sound&&Date.now()-lastCueAt>80){if(audio.play(name||'bell',profile.volume))lastCueAt=Date.now();}}
const controls=document.createElement('div');controls.className='board-workspace-tools';
controls.innerHTML='<div class="board-actions"><button data-edit>Edit</button><button data-templates>Templates</button><button data-save-custom>Save as custom timer</button><button data-duplicate>Duplicate</button><a href="../custom-timer/">Make your own timer</a></div><div class="template-shelf" hidden></div><div class="board-editor-host"></div><form class="save-custom-form" hidden><label>Save timer as<input name="name" maxlength="80" required></label><button type="submit">Save timer</button><button type="button" data-save-cancel>Cancel</button></form>';
root.before(controls);
const toolActions=controls.querySelector('.board-actions');const tools=document.createElement('details');tools.className='compact-tools';const toolsSummary=document.createElement('summary');toolsSummary.textContent='Customize';tools.append(toolsSummary,toolActions);controls.prepend(tools);if(profile.count===1)tools.append(document.querySelector('#board-start').parentElement);document.querySelector('#board-note').textContent='';

const createLink=controls.querySelector('a[href="../custom-timer/"]');const favoriteRow=document.querySelector('.favorite-panel');if(createLink&&favoriteRow)createLink.remove();

if(customId||!custom){root.after(controls.querySelector('.board-editor-host'));}

function applyProfile(next){if(board.some(c=>c.anchor!==null)){note.textContent='Pause all clocks before applying a new setup.';return;}profile=next;board=fresh();configSave();save();editor=mountEditor(editorHost,profile,applyProfile);render();}
const editorHost=document.querySelector('.board-editor-host');let editor=mountEditor(editorHost,profile,applyProfile);if(custom&&!customId)editor.open();
controls.querySelector('[data-edit]').onclick=()=>{editor.open();editorHost.scrollIntoView({behavior:'smooth',block:'start'});};
const templateKey='corptimer.templates.'+slug;
function templateShelf(){
 const shelf=controls.querySelector('.template-shelf');shelf.hidden=false;shelf.replaceChildren();
 const h=document.createElement('h2');h.textContent=`${custom?'Your':original.title} templates`;shelf.append(h);
 const rows=readSetting(templateKey,[]),items=[{name:'Original setup',profile:original},{name:'Short practice',profile:{...original,stages:original.stages.map(s=>({...s,seconds:s.seconds?Math.max(5,Math.round(s.seconds/2)):0}))}},...rows];
 for(const item of items){const b=document.createElement('button');b.textContent=item.name;b.onclick=()=>{applyProfile(structuredClone(item.profile));shelf.hidden=true;};shelf.append(b);}
 const name=document.createElement('input');name.placeholder='Template name';name.maxLength=80;name.setAttribute('aria-label','Template name');
 const saveTemplate=document.createElement('button');saveTemplate.textContent='Save current as template';saveTemplate.onclick=()=>{if(!name.value.trim()){name.focus();return;}const entry={name:name.value.trim(),profile:structuredClone({...profile,stages:board[0].stages,cards:board.map(c=>({...c,index:0,elapsed:0,anchor:null,laps:[],done:false,waiting:false}))})};const i=rows.findIndex(r=>r.name===entry.name);if(i>=0)rows[i]=entry;else rows.push(entry);writeSetting(templateKey,rows.slice(-50));templateShelf();};
 const create=document.createElement('button');create.textContent='Create template';create.onclick=()=>{shelf.hidden=true;editor.open();};shelf.append(name,saveTemplate,create);
}
controls.querySelector('[data-templates]').onclick=()=>{const shelf=controls.querySelector('.template-shelf');if(!shelf.hidden)shelf.hidden=true;else templateShelf();};
const saveForm=controls.querySelector('.save-custom-form');let duplicate=false;
function showSave(copy){duplicate=copy;saveForm.hidden=false;saveForm.elements.name.value=profile.title+(copy?' copy':'');saveForm.elements.name.focus();}
controls.querySelector('[data-save-custom]').onclick=()=>showSave(false);controls.querySelector('[data-duplicate]').onclick=()=>showSave(true);controls.querySelector('[data-save-cancel]').onclick=()=>saveForm.hidden=true;
saveForm.onsubmit=e=>{e.preventDefault();if(!saveForm.reportValidity())return;const id=customId&&!duplicate?customId:crypto.randomUUID();const next={...profile,title:saveForm.elements.name.value.trim(),slug:'custom-timer',stages:board[0].stages.map(s=>({...s}))};if(!writeSetting('corptimer.custom.'+id,next))return;writeSetting('corptimer.board.'+id,board.map(c=>({...c,index:0,elapsed:0,anchor:null,laps:[],done:false,waiting:false})));location.href=`../custom-timer/?id=${id}`;};
function render(){
 root.dataset.count=String(board.length);
 document.querySelector('.tool-heading h1').textContent=profile.title;
 if(custom){const heading=document.querySelector('.tool-heading');heading.classList.add('illustrated-heading');heading.querySelector('.timer-art')?.remove();heading.insertAdjacentHTML('beforeend',timerArt({slug:'custom-timer',kind:profile.art||'simple'}));}
 root.innerHTML='<button class="board-exit" type="button">Exit fullscreen</button>'+board.map((c,i)=>`<section class="board-card" data-card="${i}"><label>Participant, station or batch<input data-name="${i}" maxlength="80" value="${escape(c.name)}"></label><div class="board-clock"><button class="stage-fullscreen" data-fullscreen="${i}">Fullscreen</button><div class="clock-meta"><span id="state-${i}"></span><span id="position-${i}"></span></div><h2 id="phase-${i}"></h2>${slug==='egg-timer'?'<div class="egg-cross-section" role="img" aria-label="Illustrative egg cross-section"><i></i></div>':''}<div class="board-time" id="time-${i}" role="timer"></div><p id="instruction-${i}"></p><p class="clock-next" id="next-${i}"></p><div class="board-actions">${[['toggle','Start'],['pause','Stop'],[profile.mode==='up'?'lap':'next',profile.mode==='up'?'Lap':profile.mode==='turn'?'Next player':'Next stage'],['reset','Reset'],...(profile.mode==='up'?[]:[['add','+1 minute'],['subtract','−1 minute']])].map(([a,l])=>`<button data-action="${a}" data-index="${i}" type="button">${l}</button>`).join('')}</div></div><div data-timeline="${i}"></div><details><summary>Edit this clock & lap record</summary><p>Pause this clock to edit its slots.</p>${c.stages.map((s,j)=>`<div class="board-stage"><label>Stage<input data-stage="${i}:${j}:name" maxlength="80" value="${escape(s.name)}"></label>${profile.mode==='up'?'':`<label>Seconds<input type="number" min="1" max="86400" data-stage="${i}:${j}:seconds" value="${s.seconds}"></label>`}</div>`).join('')}<ol data-laps="${i}">${c.laps.map((ms,j)=>`<li>Lap ${j+1}: ${(ms/1000).toFixed(2)} s total · ${((ms-(c.laps[j-1]||0))/1000).toFixed(2)} s split</li>`).join('')}</ol><button data-remove-clock="${i}" ${board.length<2?'disabled':''}>Remove clock</button></details></section>`).join('');
 root.querySelector('.board-exit').onclick=()=>toggleFullscreen(root);
 timelines=board.map((c,i)=>createTimeline(root.querySelector(`[data-timeline="${i}"]`),{label:`${c.name} timeline`,seek:value=>{board[i]=seekCard(board[i],value,profile.mode);save();tick();}}));
 document.querySelector('#board-sound').textContent=profile.sound?'Sound on':'Sound off';document.querySelector('#board-sound').setAttribute('aria-pressed',String(profile.sound));document.querySelector('#board-start').textContent=profile.mode==='turn'?'Start first player':'Start all';tick();
}
function tick(){
 const now=Date.now();let changed=false;
 board=board.map((c,i)=>{
  const n=settle(c,profile.mode,now),phase=n.stages[n.index],time=elapsed(n,now)/1000,remaining=phase.seconds-time,second=Math.ceil(remaining);
  if(n.index!==c.index||n.done!==c.done||n.waiting!==c.waiting){changed=true;stageTick();cue(c.stages[c.index].cueEnd||'bell');if(!n.done&&!n.waiting&&phase.cueStart&&phase.cueStart!=='off')setTimeout(()=>cue(phase.cueStart),250);note.textContent=`${n.name}: ${n.done?'Finished':n.waiting?'Ready for next stage':phase.name}`;}
  else if(n.anchor!==null&&second!==lastSeconds[i]){if(second>0&&second===(phase.warning??10))cue('beep');if(phase.repeatCue>0&&Math.floor(time)>0&&Math.floor(time)%phase.repeatCue===0){cue('bell');note.textContent=`${n.name}: ${slug==='darkroom-timer'?'Agitate gently':'Checkpoint'} · ${phase.name}`;}if(profile.ticking&&second>0&&second<=10)cue('click');}
  lastSeconds[i]=second;
  const card=root.querySelector(`[data-card="${i}"]`);card.dataset.active=String(n.anchor!==null);card.querySelector('.board-clock').dataset.phase=phase.color||'work';
  document.querySelector(`#time-${i}`).textContent=profile.direction==='up'&&profile.mode!=='up'?`${Math.floor(time/60)}:${String(Math.floor(time)%60).padStart(2,'0')}`:display(n,profile.mode,now);
  document.querySelector(`#phase-${i}`).textContent=slug==='egg-timer'&&n.done?'Hard-boiled · 10 minutes':phase.name;
  if(slug==='egg-timer'){const egg=card.querySelector('.egg-cross-section');egg.style.setProperty('--yolk',n.done?'#f2ce64':n.index>=3?'#ecb43b':'#ef951e');egg.style.setProperty('--yolk-radius',n.index<2?'44% 55% 48% 45%':'50%');}
document.querySelector(`#state-${i}`).textContent=n.done?'Finished':n.waiting?'Ready for next stage':n.anchor===null?'Paused / ready':'Running';document.querySelector(`#position-${i}`).textContent=`${n.index+1} / ${n.stages.length}`;
  document.querySelector(`#instruction-${i}`).textContent=phase.note||'';document.querySelector(`#next-${i}`).textContent=n.stages[n.index+1]?`Next: ${n.stages[n.index+1].name}`:n.laps.length?`Last split: ${((n.laps.at(-1)-(n.laps.at(-2)||0))/1000).toFixed(2)} s`:'';
  const laps=card.querySelector('[data-laps]');if(laps.children.length!==n.laps.length)laps.innerHTML=n.laps.map((v,j)=>`<li>Lap ${j+1}: ${(v/1000).toFixed(2)} s total · ${((v-(n.laps[j-1]||0))/1000).toFixed(2)} s split</li>`).join('');
  const toggle=card.querySelector('[data-action="toggle"]');toggle.textContent=n.anchor!==null?'Pause':n.elapsed||n.index?'Resume':'Start';toggle.disabled=n.done||n.waiting;card.querySelectorAll('[data-stage]').forEach(f=>f.disabled=n.anchor!==null);
  const total=n.stages.reduce((sum,s)=>sum+s.seconds,0),value=n.stages.slice(0,n.index).reduce((sum,s)=>sum+s.seconds,0)+time;timelines[i]?.update(profile.mode==='up'?time:value,profile.mode==='up'?Math.max(600,Math.ceil(time/600)*600):total,profile.mode==='up'?[]:n.stages,n.anchor!==null||c.anchor!==null);return n;
 });if(changed)save();
}
root.onclick=async e=>{
 const full=e.target.closest('[data-fullscreen]');if(full){toggleFullscreen(full.closest('.board-clock'),full);return;}
 const remove=e.target.closest('[data-remove-clock]');if(remove){const i=+remove.dataset.removeClock;if(board[i].anchor!==null){note.textContent='Stop this clock before removing it.';return;}board.splice(i,1);save();render();return;}
 const b=e.target.closest('[data-action]');if(!b)return;const index=+b.dataset.index,action=b.dataset.action;
 await arm();const previous=board[index];board=act(board,index,action,profile.mode,Date.now());if(action==='toggle'&&previous.anchor===null)cue(previous.stages[previous.index].cueStart||'off');if(action==='lap')stageTick();if(action==='lap'&&profile.lapSound)cue('click');if(action==='next'){stageTick();}if(action==='next')cue(profile.mode==='turn'?'click':previous.stages[previous.index].cueEnd||'bell');save();tick();
};
root.onchange=e=>{const el=e.target;if(el.dataset.name!==undefined)board[+el.dataset.name].name=el.value.slice(0,80);if(el.dataset.stage){const [i,j,field]=el.dataset.stage.split(':');if(board[i].anchor!==null){render();return;}if(field==='name')board[i].stages[j].name=el.value.slice(0,80);else if(el.checkValidity())board[i].stages[j].seconds=+el.value;else{render();return;}}save();tick();};
document.querySelector('#board-start').onclick=async()=>{await arm();const now=Date.now();board=board.map(c=>settle(c,profile.mode,now)).map((c,i)=>({...c,elapsed:elapsed(c,now),anchor:!c.done&&!c.waiting&&(profile.mode!=='turn'||i===0)?now:null}));cue(board[0].stages[board[0].index].cueStart||'off');save();tick();};
document.querySelector('#board-pause').onclick=()=>{const now=Date.now();board=board.map((_,i)=>act(board,i,'pause',profile.mode,now)[i]);save();tick();};
document.querySelector('#board-add').onclick=()=>{if(board.length>=12){note.textContent='A board supports up to 12 clocks.';return;}board.push({...fresh()[0],name:`Timer ${board.length+1}`});save();render();};
document.querySelector('#board-sound').onclick=async()=>{profile.sound=!profile.sound;await arm();if(profile.sound)cue('bell');configSave();render();};
document.querySelector('#board-fullscreen').onclick=()=>toggleFullscreen(root);
document.querySelector('#board-export').onclick=()=>{
 const quote=v=>'"'+String(typeof v==='string'&&/^[=+@-]/.test(v)?"'"+v:v).replaceAll('"','""')+'"';
 const rows=[['Name','Stage','Elapsed seconds','Lap','Split seconds'],...board.flatMap(c=>[[c.name,c.stages[c.index].name,(elapsed(c,Date.now())/1000).toFixed(2),'',''],...c.laps.map((v,i)=>[c.name,'Lap',v/1000,i+1,(v-(c.laps[i-1]||0))/1000])])];
 const url=URL.createObjectURL(new Blob([rows.map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download=slug+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
render();setInterval(tick,100);setInterval(()=>save(true),5000);window.addEventListener('pagehide',()=>save(true));document.body.dataset.timerReady='true';
