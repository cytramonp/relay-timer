export function themeDefaults(input){
 const p=structuredClone(input),slug=p.slug;
 if(['kitchen-timer','meditation-timer','tea-brewing-timer'].includes(slug))p.sound??=true;
 if(slug==='tea-brewing-timer')p.automatic??=false;
 if(slug==='meditation-timer')p.stages=p.stages.map(s=>({...s,repeatCue:s.name==='Meditation'?300:0,cueEnd:'bell',warning:0}));
 if(slug==='breathing-timer')p.stages=p.stages.map(s=>({...s,cueEnd:'off',warning:0}));
 if(slug==='toothbrushing-timer'){p.kidsView??=true;p.stages=p.stages.map(s=>({...s,cueEnd:'click',warning:0}));}
 if(slug==='speech-timer'){p.green??=120;p.amber??=150;p.red??=180;}
 if(slug==='kitchen-timer'&&!p.cards){p.cards=[['Oven dish',[['Cook',1200],['Rest before serving',300]]],['Saucepan',[['Simmer',720],['Finish',180]]],['Frying pan',[['First side',240],['Second side',240],['Rest',120]]]].map(([name,stages])=>({name,stages:stages.map(([name,seconds])=>({name,seconds,cueEnd:'bell',warning:30,note:'Example timing — follow your recipe.'})),index:0,elapsed:0,anchor:null,laps:[],done:false}));}
 return p;
}
export function themeMarkup(slug){
 if(slug==='breathing-timer')return '<div class="breathing-visual" aria-hidden="true"><i></i></div><p class="theme-caption"></p>';
 if(slug==='toothbrushing-timer')return '<div class="brushing-zones" role="img" aria-label="Four brushing zones"><span>Upper left</span><span>Upper right</span><span>Lower left</span><span>Lower right</span></div>';
 if(slug==='speech-timer')return '<div class="speech-lights" aria-hidden="true"><i></i><i></i><i></i></div><p class="theme-caption" role="status"></p>';
 if(slug==='yoga-stretching-timer')return '<div class="pose-side" aria-hidden="true"></div>';
 return '';
}
export function updateTheme(card,slug,c,p,time){
 const name=c.stages[c.index].name;
 if(slug==='breathing-timer'){
  const inhale=/inhale/i.test(name),hold=/hold|pause/i.test(name),fraction=Math.min(1,time/Math.max(1,c.stages[c.index].seconds));
  card.querySelector('.breathing-visual i').style.transform=`scale(${hold?1:inhale?.55+.45*fraction:1-.45*fraction})`;
  card.querySelector('.theme-caption').textContent=`Cycle ${Math.floor(c.index/2)+1} / ${Math.ceil(c.stages.length/2)} · ${name}`;
 }
 if(slug==='toothbrushing-timer'){
  const box=card.querySelector('.brushing-zones');box.hidden=p.kidsView===false;
  const order=[0,1,3,2];box.querySelectorAll('span').forEach((el,i)=>{const active=i===order[c.index%4]&&!c.done;el.classList.toggle('active',active);el.setAttribute('aria-label',el.textContent+(active?' · current zone':''));});
 }
 if(slug==='speech-timer'){
  const previous=card.dataset.speechSignal;const signal=time>=p.red?'red':time>=p.amber?'amber':time>=p.green?'green':'ready';card.querySelector('.board-clock').dataset.speech=signal;card.dataset.speechSignal=signal;
  card.querySelectorAll('.speech-lights i').forEach((el,i)=>el.classList.toggle('active',['green','amber','red'][i]===signal));
  const thresholds=`Green ${format(p.green)} · Amber ${format(p.amber)} · Red ${format(p.red)}`;
  const caption=card.querySelector('.theme-caption');const text=`${signal==='ready'?'Rehearsal':signal[0].toUpperCase()+signal.slice(1)+' signal'} · ${thresholds}`;if(caption.textContent!==text)caption.textContent=text;return !!previous&&previous!==signal&&c.anchor!==null;
 }
 if(slug==='yoga-stretching-timer')card.querySelector('.pose-side').textContent=/left/i.test(name)?'Left side':/right/i.test(name)?'Right side':/rest/i.test(name)?'Rest':'Your next pose';
}
const format=s=>`${Math.floor(s/60)}:${String(Math.floor(s)%60).padStart(2,'0')}`;
export function mountThemeControls(host,get,apply,save,getBoard,schedule){
 const slug=get().slug;if(!['kitchen-timer','meditation-timer','breathing-timer','toothbrushing-timer','speech-timer'].includes(slug))return;
 const form=document.createElement('form');form.className='theme-controls';
 if(slug==='kitchen-timer'){
  form.innerHTML='<label>Serve dishes together at<input type="datetime-local" name="serve" required></label><button type="submit">Schedule dishes</button><p>Starts each dish early enough for its cooking and resting stages to finish at the same time. Example timings must be replaced with your recipe. Keep this tab open; reload cancels scheduled starts.</p><p class="theme-error" role="alert"></p>';
  form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;if(getBoard().some(c=>c.anchor!==null)){form.querySelector('.theme-error').textContent='Pause all dishes before scheduling.';return;}if(get().mode!=='sequence'){form.querySelector('.theme-error').textContent='Use countdown slots for the serving planner.';return;}const target=new Date(form.elements.serve.value).getTime();if(!Number.isFinite(target)||target<=Date.now()){form.querySelector('.theme-error').textContent='Choose a future serving time.';return;}schedule(target);};
 } else if(slug==='speech-timer'){
  form.innerHTML='<p>Signal thresholds · elapsed seconds</p>'+['green','amber','red'].map(key=>`<label>${key[0].toUpperCase()+key.slice(1)}<input type="number" name="${key}" min="1" max="86400" step="1" data-time-field value="${get()[key]}" required></label>`).join('')+'<button type="submit">Apply signals</button><p class="theme-error" role="alert"></p>';
  form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const p=get(),values=['green','amber','red'].map(k=>+form.elements[k].value);if(!(values[0]<values[1]&&values[1]<values[2])){form.querySelector('.theme-error').textContent='Use Green < Amber < Red.';return;}['green','amber','red'].forEach((k,i)=>p[k]=values[i]);save();};
 } else if(slug==='breathing-timer'){
  form.innerHTML=`<label>Cycles<input name="cycles" type="number" min="1" max="50" value="${Math.ceil(get().stages.length/2)}" required></label><button type="submit">Apply cycle count</button><p>Edit inhale and exhale durations under Edit timer. Apply while paused.</p>`;
  form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const p=get(),pair=p.stages.slice(0,2);apply({...p,stages:Array.from({length:+form.elements.cycles.value},()=>pair.map(s=>({...s}))).flat()});};
 } else {
  const field=slug==='meditation-timer'?'hideDigits':'kidsView',label=slug==='meditation-timer'?'Hide clock digits':'Show brushing-zone guide';
  form.innerHTML=`<label><input type="checkbox" name="visual" ${get()[field]?'checked':''}> ${label}</label>`;
  form.onchange=()=>{get()[field]=form.elements.visual.checked;save();};form.onsubmit=e=>e.preventDefault();
 }
 host.append(form);
}

export function scheduleForServing(board,target,now){
 if(!Number.isFinite(target))throw Error('Choose a valid serving time.');
 const starts=board.map(c=>target-c.stages.reduce((n,s)=>n+s.seconds,0)*1000);
 if(starts.some(t=>t<now))throw Error('Choose a serving time late enough for every dish to start in the future.');
 return board.map((c,i)=>({...c,index:0,elapsed:0,anchor:null,done:false,waiting:false,scheduledAt:starts[i]}));
}
