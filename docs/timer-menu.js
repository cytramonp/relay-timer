import { timerArt } from './timer-art.js';
import { timers, timerHref } from './timer-catalog.js?v=20';

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function renderTimerMenu(current='',prefix='../',label='Other Timers') {
  const activities=timers.filter(timer=>!timer.minutes);
  const durations=timers.filter(timer=>timer.minutes);
  const link=timer=>`<a href="${timerHref(timer,prefix)}"${timer.slug===current?' aria-current="page"':''}>${timerArt(timer,'menu-art')}<span>${escape(timer.title)}</span></a>`;
  const groups=['Everyday','Sports','Professional','Learning & events'];
  const category=t=>t.category||(['boxing','fitness'].includes(t.kind)?'Sports':t.kind==='meeting'?'Professional':t.kind==='classroom'?'Learning & events':'Everyday');
  return `<details class="timer-switcher"><summary>${escape(label)}<svg class="menu-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg></summary><div class="timer-menu"><div class="catalog-tools"><button type="button" data-menu-close aria-label="Close timer menu">Close</button><button type="button" data-collapse>Collapse to Groups</button><a href="${prefix}custom-timer/">Make your own timer</a></div>${groups.map(g=>`<details class="timer-category" open><summary>${escape(g)}</summary><ul class="timer-menu-list">${activities.filter(t=>category(t)===g).map(timer=>`<li>${link(timer)}</li>`).join('')}</ul></details>`).join('')}<details class="timer-category" open><summary>A few minutes</summary><div class="timer-menu-minutes">${durations.map(timer=>link(timer)).join('')}</div></details><a class="timer-menu-all" href="${prefix}timers/">Browse all timers</a></div></details>`;
}

if(typeof document!=='undefined') {
  const menus=()=>Array.from(document.querySelectorAll('.timer-switcher'));
  document.addEventListener('toggle',event=>{
    if(!event.target.matches?.('.timer-switcher[open]'))return;
    menus().forEach(menu=>{if(menu!==event.target)menu.open=false;});
  },true);
  document.addEventListener('click',event=>{
    const close=event.target.closest('[data-menu-close]');if(close){close.closest('.timer-switcher').open=false;return;}
    const collapse=event.target.closest('[data-collapse]');if(collapse){const scope=collapse.closest('.timer-menu,.directory-group');const closed=collapse.dataset.collapsed!=='true';scope.querySelectorAll('.timer-category,.directory-category').forEach(group=>group.open=!closed);collapse.dataset.collapsed=String(closed);collapse.textContent=closed?'Show All Timers':'Collapse to Groups';}

    menus().forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const menu=menus().find(item=>item.open);
    if(menu){event.preventDefault();menu.open=false;menu.querySelector('summary').focus();}
  });
}
