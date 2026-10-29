import {createAlarm} from './timeline-alarm.js';
export function createTimeline(parent,{label='Timeline',seek}){
  const wrap=document.createElement('div');wrap.className='timer-timeline';
  const title=document.createElement('label');title.textContent=label;
  const input=document.createElement('input');input.type='range';input.min='0';input.max='600';input.step='1';input.setAttribute('aria-label',label);
  const phases=document.createElement('div');phases.className='timeline-phases';
  phases.style.position='relative';
  const axis=document.createElement('div');axis.className='timeline-axis';
  const hint=document.createElement('small');hint.textContent='Drag to change time · releases paused';
  title.append(input);wrap.append(phases,title,axis,hint);parent.append(wrap);
  const clock=parent.closest('.board-card')?.querySelector('.board-clock')||parent.previousElementSibling;let strip;if(clock?.matches('.clock-stage,.board-clock')){strip=document.createElement('div');strip.className='clock-segments';strip.setAttribute('aria-hidden','true');clock.querySelector('.clock-actions,.board-actions')?.before(strip);}
  let dragging=false;
  input.addEventListener('pointerdown',()=>dragging=true);
  input.addEventListener('input',()=>{dragging=true;input.setAttribute('aria-valuetext',format(+input.value));});
  input.addEventListener('change',()=>{seek(+input.value);dragging=false;});
  input.addEventListener('pointercancel',()=>dragging=false);
  input.addEventListener('blur',()=>dragging=false);
  const alarm=document.body.dataset.timerKind==='newyear'?null:createAlarm(wrap,(document.body.dataset.timerSlug||'meeting')+'.'+label);
  let signature='';
  return {update(value,max,stages=[],running=false,alarmValue=value){
    alarm?.update(alarmValue,max,running);
    axis.textContent='0:00 — '+format(max);
    if(!dragging){input.max=String(Math.max(1,max));input.value=String(Math.min(max,value));input.setAttribute('aria-valuetext',format(value));input.style.setProperty('--position',`${Math.min(100,value/Math.max(1,max)*100)}%`);}
    let boundary=0;phases.querySelectorAll('span').forEach(el=>{const start=boundary;boundary+=Number(el.dataset.duration);el.classList.toggle('is-current',value>=start&&value<boundary);el.classList.toggle('is-past',value>=boundary);});
    if(strip){if(strip.children.length!==stages.length){strip.replaceChildren(...stages.map(s=>{const el=document.createElement('span');el.style.flex=String(s.seconds||1);return el;}));}let at=0;Array.from(strip.children).forEach((el,i)=>{const start=at;at+=stages[i].seconds;el.className=value>=at?'is-past':value>=start?'is-current':'';});}
    const next=JSON.stringify(stages);if(next!==signature){signature=next;phases.replaceChildren(...stages.map(s=>{const el=document.createElement('span');el.textContent=s.name;el.style.flex=String(s.seconds||1);el.dataset.duration=String(s.seconds||1);el.title=`${s.name} · ${format(s.seconds)}`;return el;}));}
  }};
}
function format(seconds){return `${Math.floor(seconds/60)}:${String(Math.floor(seconds)%60).padStart(2,'0')}`;}
