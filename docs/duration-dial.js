// One reusable editor for durations. Counts, volume and other numeric settings stay ordinary fields.
const timeNames=new Set(['hours','minutes','seconds','duration','work','rest','longRest','setRest','prepare','cooldown','increment','delay','warning','finalCue','floor','warn']);
const eligible=el=>el?.matches?.('input[type="number"]')&&!el.disabled&&!el.readOnly&&(timeNames.has(el.name)||['work','rest'].includes(el.dataset.key)||el.id==='totalMin'||el.classList.contains('mn')||el.closest('.template-slot')||el.dataset.field==='seconds'||el.dataset.stage?.endsWith(':seconds')||['setFloor','setWarn'].includes(el.id));
export function dialDelta(previous,next){let d=next-previous;while(d>Math.PI)d-=2*Math.PI;while(d< -Math.PI)d+=2*Math.PI;return d;}
export function dialValue(value,steps,step,min,max){return Math.min(max,Math.max(min,Math.round((value+steps*step)*10000)/10000));}
if(typeof document!=='undefined'){
 const dialog=document.createElement('dialog');dialog.className='duration-dial';dialog.setAttribute('aria-label','Adjust duration');
 dialog.innerHTML='<div class="dial-heading"><strong>Adjust time</strong><button type="button" data-close aria-label="Close time dial">Close</button></div><div class="dial-face"><div class="dial-ring" role="slider" tabindex="0" aria-label="Rotate to adjust time"><svg viewBox="0 0 240 240" aria-hidden="true"><circle cx="120" cy="120" r="103"/><g class="dial-ticks"></g><path class="dial-hand" d="M120 29V43"/></svg></div><label class="dial-value"><span class="dial-unit">Minutes</span><input type="number" aria-label="Duration value"></label></div><p class="dial-help">Clockwise adds time. Counterclockwise subtracts.</p><div class="dial-actions"><button type="button" data-minus aria-label="Decrease time">−</button><button type="button" data-plus aria-label="Increase time">+</button><button type="button" data-apply>Apply</button></div>';
 document.body.append(dialog);
 const ring=dialog.querySelector('.dial-ring'),number=dialog.querySelector('input'),unit=dialog.querySelector('.dial-unit'),hand=dialog.querySelector('.dial-hand');
 dialog.querySelector('.dial-ticks').innerHTML=Array.from({length:60},(_,i)=>`<path d="M120 ${i%5===0?17:21}V${i%5===0?30:27}" transform="rotate(${i*6} 120 120)"/>`).join('');
 let source,value=0,step=1,min=0,max=86400,angle=null,remainder=0,turnSteps=60;
 function draw(){number.value=value;ring.setAttribute('aria-valuenow',value);ring.setAttribute('aria-valuemin',min);ring.setAttribute('aria-valuemax',max);ring.setAttribute('aria-valuetext',`${value} ${unit.textContent}`);hand.style.transform=`rotate(${value/step/turnSteps*360}deg)`;}
 function adjust(steps){value=dialValue(value,steps,step,min,max);draw();}
 function open(input){
  if(dialog.open)return;source=input;source.focus({preventScroll:true});step=Number(input.step)||1;min=input.min===''?0:Number(input.min);max=input.max===''?86400:Number(input.max);value=Math.min(max,Math.max(min,Number(input.value)||0));turnSteps=input.name==='hours'?24:60;
  number.min=min;number.max=max;number.step=step;
  const label=input.getAttribute('aria-label')||input.closest('label')?.textContent.trim().split('\n')[0]||'Time';
  unit.textContent=/hour/i.test(label)?'Hours':/second|sec|work|rest|prepare|cooldown|warning|increment|delay/i.test(label)||input.dataset.field==='seconds'||input.dataset.stage?.endsWith(':seconds')?'Seconds':'Minutes';
  if(input.id==='setWarn')unit.textContent='Minutes';
  if(document.body.dataset.timerKind==='pomodoro'&&['work','rest','longRest'].includes(input.name))unit.textContent='Minutes';
  dialog.querySelector('.dial-help').textContent=`Clockwise + · counterclockwise −. One turn = ${turnSteps*step} ${unit.textContent.toLowerCase()}.`;
  remainder=0;angle=null;draw();dialog.showModal();
  const r=input.getBoundingClientRect(),w=Math.min(280,innerWidth-24),h=Math.min(dialog.getBoundingClientRect().height,innerHeight-24);dialog.style.width=w+'px';dialog.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2))+'px';dialog.style.top=Math.max(12,Math.min(innerHeight-h-12,r.top+r.height/2-h/2))+'px';ring.focus({preventScroll:true});
 }
 function close(){dialog.close();angle=null;if(source?.isConnected)source.focus({preventScroll:true});}
 function pointerAngle(e){const r=ring.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2);}
 ring.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();angle=pointerAngle(e);remainder=0;ring.setPointerCapture(e.pointerId);};
 ring.onpointermove=e=>{if(angle===null)return;const r=ring.getBoundingClientRect();if(Math.hypot(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2)<r.width*.22){angle=pointerAngle(e);return;}const next=pointerAngle(e);remainder+=dialDelta(angle,next)/(Math.PI*2)*turnSteps;angle=next;const steps=Math.trunc(remainder);if(steps){adjust(steps);remainder-=steps;}};
 ring.onpointerup=ring.onpointercancel=ring.onlostpointercapture=()=>{angle=null;remainder=0;};
 ring.onkeydown=e=>{const d=['ArrowRight','ArrowUp'].includes(e.key)?1:['ArrowLeft','ArrowDown'].includes(e.key)?-1:0;if(d){e.preventDefault();adjust(d*(e.shiftKey?10:1));}if(e.key==='Home'){e.preventDefault();value=min;draw();}if(e.key==='End'){e.preventDefault();value=max;draw();}};
 ring.addEventListener('wheel',e=>{e.preventDefault();adjust(e.deltaY<0?1:-1);},{passive:false});
 number.oninput=()=>{if(number.value!==''&&number.checkValidity()){value=+number.value;draw();}};
 dialog.querySelector('[data-minus]').onclick=()=>adjust(-1);dialog.querySelector('[data-plus]').onclick=()=>adjust(1);dialog.querySelector('[data-close]').onclick=close;
 dialog.querySelector('[data-apply]').onclick=()=>{if(!number.reportValidity()||!source?.isConnected||source.disabled)return;const target=source;target.value=number.value;target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));close();};
 dialog.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.target===ring||e.target===number)){e.preventDefault();dialog.querySelector('[data-apply]').click();}});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 document.addEventListener('pointerdown',e=>{if(!dialog.contains(e.target)&&eligible(e.target)){e.preventDefault();open(e.target);}},true);
 document.addEventListener('keydown',e=>{if(!dialog.contains(e.target)&&eligible(e.target)&&['Enter',' '].includes(e.key)){e.preventDefault();open(e.target);}},true);
 const annotate=input=>{if(eligible(input)&&!input.dataset.durationDial){input.dataset.durationDial='true';input.setAttribute('aria-haspopup','dialog');input.title='Click to rotate time. Keyboard input also works.';}};
 const mark=root=>{if(root.matches?.('input[type="number"]'))annotate(root);root.querySelectorAll?.('input[type="number"]').forEach(annotate);};
 mark(document);new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)mark(node);}).observe(document.body,{childList:true,subtree:true});
}
