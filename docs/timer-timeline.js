export function createTimeline(parent,{label='Timeline',seek}){
  const wrap=document.createElement('div');wrap.className='timer-timeline';
  const title=document.createElement('label');title.textContent=label;
  const input=document.createElement('input');input.type='range';input.min='0';input.max='600';input.step='1';input.setAttribute('aria-label',label);
  const phases=document.createElement('div');phases.className='timeline-phases';
  const hint=document.createElement('small');hint.textContent='Drag to change time · releases paused';
  title.append(input);wrap.append(title,phases,hint);parent.append(wrap);
  let dragging=false;
  input.addEventListener('pointerdown',()=>dragging=true);
  input.addEventListener('input',()=>{dragging=true;input.setAttribute('aria-valuetext',format(+input.value));});
  input.addEventListener('change',()=>{seek(+input.value);dragging=false;});
  input.addEventListener('pointercancel',()=>dragging=false);
  input.addEventListener('blur',()=>dragging=false);
  let signature='';
  return {update(value,max,stages=[]){
    if(!dragging){input.max=String(Math.max(1,max));input.value=String(Math.min(max,value));input.setAttribute('aria-valuetext',format(value));input.style.setProperty('--position',`${Math.min(100,value/Math.max(1,max)*100)}%`);}
    const next=JSON.stringify(stages);if(next!==signature){signature=next;phases.replaceChildren(...stages.map(s=>{const el=document.createElement('span');el.textContent=s.name;el.style.flex=String(s.seconds||1);el.title=`${s.name} · ${format(s.seconds)}`;return el;}));}
  }};
}
function format(seconds){return `${Math.floor(seconds/60)}:${String(Math.floor(seconds)%60).padStart(2,'0')}`;}
