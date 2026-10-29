import {CuePlayer} from './cue-player.js';
import {readSetting,writeSetting} from './timer-store.js';
const player=new CuePlayer(),key='corptimer.options.stage-tick.'+(document.body.dataset.timerSlug||'meeting');
let enabled=readSetting(key,true),arming;
function arm(){arming=player.arm().catch(()=>{});return arming;}
document.addEventListener('pointerdown',arm,{capture:true});
document.addEventListener('keydown',arm,{capture:true});
export function stageTick(){if(enabled)player.play('click',45);}
setTimeout(()=>{const host=document.querySelector('.sound-settings,.compact-tools,.settings');if(!host)return;const label=document.createElement('label');label.className='stage-tick-option';const input=document.createElement('input');input.type='checkbox';input.checked=enabled;input.onchange=async()=>{enabled=input.checked;writeSetting(key,enabled);await arm();if(enabled)stageTick();};label.append(input,' Stage transition tick');host.append(label);},0);
