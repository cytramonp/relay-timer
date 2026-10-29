import {createAlarm} from './timeline-alarm.js';
import {elapsedTime} from './model.js';
import {loadCloud} from './cloud.js';
import {localSettings,receiveSetting,selectAccount,writeSetting} from './timer-store.js';
import {toggleFullscreen} from './fullscreen.js';
const bar=document.createElement('div');bar.className='timer-account';
const status=document.createElement('span');status.className='account-save-status';status.role='status';status.textContent='Saved locally';
const button=document.createElement('button');button.type='button';button.textContent='Sign in with Google';
const reload=document.createElement('button');reload.type='button';reload.textContent='Load synced settings';reload.hidden=true;reload.onclick=()=>location.reload();
if(document.querySelector('#account-button'))button.hidden=true;
bar.append(status,button,reload);document.querySelector('.app-header nav')?.append(bar);
let cloud,user,stop,ready=false,generation=0;
const pending=new Map();let flushTimer;
const error=e=>{status.textContent='Saved locally · sync unavailable';status.title=e?.message||'Retry signing in when connected.';};
async function flush(){if(!user||!cloud||!ready)return;const uid=user.uid,version=generation;status.textContent='Syncing…';try{for(const [key,row]of pending){await cloud.writeSetting(uid,row);if(version!==generation)return;if(pending.get(key)===row)pending.delete(key);}status.textContent='Saved to your account';}catch(e){error(e);}}
window.addEventListener('timer-setting-written',e=>{if(!user){status.textContent='Saved locally';return;}pending.set(e.detail.key,e.detail);clearTimeout(flushTimer);flushTimer=setTimeout(flush,650);});
async function authChanged(next){
  const authVersion=++generation;stop?.();stop=null;ready=false;pending.clear();user=next;
  if(selectAccount(user?.uid)){location.reload();return;}
  button.textContent=user?`Sign out · ${user.displayName||user.email||'Google account'}`:'Sign in with Google';
  if(!user){status.textContent='Saved locally';return;}
  cloud=await loadCloud();if(authVersion!==generation||!user)return;status.textContent='Syncing…';
  let first=true;
  stop=cloud.watchSettings(user.uid,rows=>{
    const local=new Map(localSettings().map(r=>[r.key,r]));let changed=false;
    for(const row of rows){const own=local.get(row.key);if(!own||row.updatedAt>own.updatedAt){changed=receiveSetting(row)||changed;local.delete(row.key);pending.delete(row.key);}else if(row.updatedAt===own.updatedAt)local.delete(row.key);}
    if(first){first=false;for(const r of local.values()){if(!r.updatedAt){writeSetting(r.key,JSON.parse(r.value));}else pending.set(r.key,r);}}
    ready=true;if(changed){reload.hidden=false;window.dispatchEvent(new Event('timer-settings-received'));}
    if(pending.size)flush();else status.textContent='Saved to your account';
  },error);
}
button.onclick=async()=>{button.disabled=true;try{cloud=await loadCloud();if(user)await cloud.signOut();else await cloud.signIn();}catch(e){error(e);}finally{button.disabled=false;}};
loadCloud(authChanged,error).then(c=>cloud=c).catch(error);
window.addEventListener('online',flush);
const full=document.querySelector('#meeting-fullscreen');if(full)full.onclick=()=>toggleFullscreen(full.closest('.timer-block'),full);
const own=document.createElement('details');own.className='custom-library';bar.append(own);
function drawCustomLibrary(){
  own.replaceChildren();const summary=document.createElement('summary');summary.textContent='My timers';own.append(summary);
  const entries=localSettings().filter(r=>r.key.startsWith('corptimer.custom.'));
  const list=document.createElement('div');list.className='custom-timer-list';
  for(const row of entries){const timer=JSON.parse(row.value);if(!timer||!timer.title)continue;const id=row.key.slice('corptimer.custom.'.length);const a=document.createElement('a');a.textContent=timer.title;a.href=new URL(`./custom-timer/?id=${encodeURIComponent(id)}`,import.meta.url).href;list.append(a);}
  if(!list.children.length){const p=document.createElement('p');p.textContent='Save a timer with your own slots, signals and participants.';list.append(p);}
  const create=document.createElement('a');create.href=new URL('./custom-timer/',import.meta.url).href;create.textContent='Make your own timer';list.append(create);own.append(list);
}
drawCustomLibrary();window.addEventListener('timer-settings-received',drawCustomLibrary);window.addEventListener('timer-setting-written',drawCustomLibrary);

const meetingTimeline=document.querySelector('.timeline-panel');if(meetingTimeline){const alarm=createAlarm(meetingTimeline,'meeting');setInterval(()=>{const s=window.relayTimer?.snapshot();if(!s)return;const r=s.run;alarm.update(r?elapsedTime(r,Date.now())/1000:0,s.agenda.reduce((n,a)=>n+a.min,0)*60,!!r&&r.pauseAt==null&&r.doneAt==null);},200);}
