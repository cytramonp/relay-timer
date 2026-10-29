import { timers, timerHref } from './timer-catalog.js';

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function renderTimerMenu(current='',prefix='../',label='Other Timers') {
  const activities=timers.filter(timer=>!timer.minutes);
  const durations=timers.filter(timer=>timer.minutes);
  const link=timer=>`<a href="${timerHref(timer,prefix)}"${timer.slug===current?' aria-current="page"':''}>${escape(timer.title)}</a>`;
  const groups=['Everyday','Sports','Professional','Learning & events'];
  const category=t=>t.category||(['boxing','fitness'].includes(t.kind)?'Sports':t.kind==='meeting'?'Professional':t.kind==='classroom'?'Learning & events':'Everyday');
  return `<details class="timer-switcher"><summary>${escape(label)}</summary><div class="timer-menu">${groups.map(g=>`<details class="timer-category"><summary>${escape(g)}</summary><ul class="timer-menu-list">${activities.filter(t=>category(t)===g).map(timer=>`<li>${link(timer)}</li>`).join('')}</ul></details>`).join('')}<details class="timer-category"><summary>A few minutes</summary><div class="timer-menu-minutes">${durations.map(timer=>link(timer)).join('')}</div></details><a class="timer-menu-all" href="${prefix}timers/">Browse all timers</a></div></details>`;
}

if(typeof document!=='undefined') {
  const menus=()=>Array.from(document.querySelectorAll('.timer-switcher'));
  document.addEventListener('toggle',event=>{
    if(!event.target.matches?.('.timer-switcher[open]'))return;
    menus().forEach(menu=>{if(menu!==event.target)menu.open=false;});
  },true);
  document.addEventListener('click',event=>{
    menus().forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const menu=menus().find(item=>item.open);
    if(menu){event.preventDefault();menu.open=false;menu.querySelector('summary').focus();}
  });
}
