import { timers, timerHref } from './timer-catalog.js';

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function renderTimerMenu(current='',prefix='../',label='Other Timers') {
  const activities=timers.filter(timer=>!timer.minutes);
  const durations=timers.filter(timer=>timer.minutes);
  const link=timer=>`<a href="${timerHref(timer,prefix)}"${timer.slug===current?' aria-current="page"':''}>${escape(timer.title)}</a>`;
  return `<details class="timer-switcher"><summary>${escape(label)}<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><div class="timer-menu"><div class="menu-rule" aria-hidden="true"></div><p class="menu-label">By activity</p><ul class="timer-menu-list">${activities.map(timer=>`<li>${link(timer)}</li>`).join('')}</ul><p class="menu-label">A few minutes</p><div class="timer-menu-minutes">${durations.map(timer=>`<a href="${timerHref(timer,prefix)}"${timer.slug===current?' aria-current="page"':''}>${timer.minutes} min</a>`).join('')}</div><a class="timer-menu-all" href="${prefix}timers/"${current==='timers'?' aria-current="page"':''}>Browse all timers<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></a></div></details>`;
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
