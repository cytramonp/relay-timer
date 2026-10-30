import {CuePlayer} from './cue-player.js';
import {readSetting,writeSetting} from './timer-store.js';
const sharedPlayer=new CuePlayer();
export function createAlarm(host,id){
 const player=sharedPlayer,key='corptimer.options.alarm.'+id;
 let state=readSetting(key,{enabled:false,at:300}),previous=null,fired=false,armed=false,pending=false;
 const box=document.createElement('div');box.className='timeline-alarm';
 const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=state.enabled;label.append(check,' Set alarm');
 const rangeLabel=document.createElement('label');rangeLabel.textContent='Alarm at';const range=document.createElement('input');range.type='range';range.min='1';range.max='600';range.step='1';range.value=state.at;range.setAttribute('aria-label','Alarm at');rangeLabel.append(range);
 const out=document.createElement('output');out.setAttribute('aria-live','polite');
 const test=document.createElement('button');test.type='button';test.textContent='Test alarm';
 const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s)%60).padStart(2,'0')}`;
 function draw(){rangeLabel.hidden=!state.enabled;test.hidden=!state.enabled;out.textContent=state.enabled?`Alarm at ${fmt(state.at)}${armed?'':' · tap Test alarm to enable sound'}`:'';range.value=state.at;}
 async function arm(){try{await player.arm();armed=true;}catch{out.textContent='Sound unavailable. Check connection and test again.';return false;}return true;}
 function save(){fired=false;pending=false;writeSetting(key,state);draw();}
 check.onchange=async()=>{state.enabled=check.checked;save();if(await arm())draw();};
 range.oninput=()=>{state.at=+range.value;out.textContent=`Alarm at ${fmt(state.at)}`;};
 range.onchange=async()=>{state.at=+range.value;save();if(await arm())draw();};
 test.onclick=async()=>{if(await arm()){player.play('bell',85);draw();}};
 // Start gestures unlock audio for an alarm restored from a previous visit.
 const unlock=()=>{if(!box.isConnected){host.ownerDocument.removeEventListener('pointerdown',unlock,true);host.ownerDocument.removeEventListener('keydown',unlock,true);return;}if(state.enabled&&!armed)arm();};host.ownerDocument.addEventListener('pointerdown',unlock,true);host.ownerDocument.addEventListener('keydown',unlock,true);
 box.append(label,rangeLabel,out,test);host.append(box);draw();
 return {update(value,max,running){range.max=String(Math.max(1,Math.floor(max)));if(state.at>max){state.at=Math.max(1,Math.floor(max));draw();}if(previous!==null&&value<previous){fired=false;pending=false;}
  if(state.enabled&&running&&!fired&&previous!==null&&previous<state.at&&value>=state.at){pending=true;fired=player.play('bell',85);if(fired)out.textContent=`Alarm · ${fmt(state.at)}`;}
  if(pending&&!fired&&state.enabled&&running&&armed){fired=player.play('bell',85);if(fired)out.textContent=`Alarm · ${fmt(state.at)}`;}
  previous=value;
 }};
}
