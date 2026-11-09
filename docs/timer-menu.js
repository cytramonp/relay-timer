import {byPopularity} from './timer-popularity.js';
import {t} from './i18n-core.js';
import { timerArt } from './timer-art.js';
import { timers, timerHref } from './timer-catalog.js?v=22';

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const normalizeSearch=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/ß/g,'ss').trim();
export function matchesTimerSearch(query,...fields){const text=normalizeSearch(fields.join(' '));return normalizeSearch(query).split(/\s+/).every(word=>text.includes(word));}
export function renderTimerMenu(current='',prefix='../',label='Other Timers') {
  const activities=timers.filter(timer=>!timer.minutes).sort(byPopularity);
  const durations=timers.filter(timer=>timer.minutes);
  const link=timer=>`<a href="${timerHref(timer,prefix)}"${timer.slug===current?' aria-current="page"':''}>${timerArt(timer,'menu-art')}<span>${escape(timer.title)}</span></a>`;
  const groups=['Everyday','Sports','Professional','Learning & events'];
  const category=t=>t.category||(['boxing','fitness'].includes(t.kind)?'Sports':t.kind==='meeting'?'Professional':t.kind==='classroom'?'Learning & events':'Everyday');
  return `<details class="timer-switcher"><summary>${escape(label)}<svg class="menu-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg></summary><div class="timer-menu"><div class="timer-search"><label><span class="sr-only">Search timers</span><input type="search" data-timer-search placeholder="Search by name or activity" autocomplete="off" spellcheck="false"></label><button type="button" data-search-clear hidden aria-label="Clear search">×</button></div><p class="timer-search-empty" data-search-empty role="status" hidden>No timers found. Try another name or activity.</p><div class="catalog-tools"><button type="button" data-menu-close aria-label="Close timer menu">Close</button><button type="button" data-collapse>Collapse to Groups</button><a href="${prefix}custom-timer/">Make your own timer</a></div><ul class="timer-menu-list timer-popular-list">${activities.map(t=>`<li>${link(t)}</li>`).join('')}</ul><div class="timer-group-list" hidden>${groups.map(g=>`<details class="timer-category"><summary>${escape(g)}</summary><ul class="timer-menu-list">${activities.filter(t=>category(t)===g).map(timer=>`<li>${link(timer)}</li>`).join('')}</ul></details>`).join('')}</div><details class="timer-category" open><summary>A few minutes</summary><div class="timer-menu-minutes">${durations.map(timer=>link(timer)).join('')}</div></details><a class="timer-menu-all" href="${prefix}timers/">Browse all timers</a></div></details>`;
}

if(typeof document!=='undefined') {
  const menus=()=>Array.from(document.querySelectorAll('.timer-switcher'));
  for(const menu of menus()) {
    const search=menu.querySelector('[data-timer-search]');if(!search)continue;
    const flat=menu.querySelector('.timer-popular-list'),groups=menu.querySelector('.timer-group-list'),minutes=menu.querySelector('.timer-menu-minutes').closest('details'),collapse=menu.querySelector('[data-collapse]');
    const links=[...flat.querySelectorAll('a'),...minutes.querySelectorAll('a')];
    function filter(){
      const query=search.value.trim();let count=0;
      for(const a of links){const slug=new URL(a.href).pathname.replace(/\/$/,'').split('/').at(-1);const timer=timers.find(t=>t.slug===slug)||timers.find(t=>t.slug==='');const show=matchesTimerSearch(query,a.textContent,timer?.title,t(timer?.description),t(timer?.detail),t(timer?.category));(a.closest('li')||a).hidden=!show;if(show)count++;}
      const grouped=collapse.dataset.collapsed==='true';flat.hidden=query?false:grouped;groups.hidden=query?true:!grouped;
      collapse.disabled=!!query;minutes.open=!!query||!grouped;minutes.hidden=!!query&&[...minutes.querySelectorAll('a')].every(a=>a.hidden);
      menu.querySelector('[data-search-empty]').hidden=!query||count>0;
      menu.querySelector('[data-search-clear]').hidden=!query;
    }
    search.addEventListener('input',filter);
    menu.querySelector('[data-search-clear]').addEventListener('click',()=>{search.value='';filter();search.focus();});
  }
  document.addEventListener('toggle',event=>{
    if(!event.target.matches?.('.timer-switcher[open]'))return;
    menus().forEach(menu=>{if(menu!==event.target)menu.open=false;});
  },true);
  document.addEventListener('click',event=>{
    const close=event.target.closest('[data-menu-close]');if(close){close.closest('.timer-switcher').open=false;return;}
    const collapse=event.target.closest('[data-collapse]');if(collapse){const scope=collapse.closest('.timer-menu,.directory-group');const closed=collapse.dataset.collapsed!=='true';const flat=scope.querySelector('.timer-popular-list'),grouped=scope.querySelector('.timer-group-list');if(flat)flat.hidden=closed;if(grouped)grouped.hidden=!closed;scope.querySelectorAll('.timer-category,.directory-category').forEach(group=>group.open=flat?false:!closed);collapse.dataset.collapsed=String(closed);collapse.textContent=closed?'Show All Timers':'Collapse to Groups';}

    menus().forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const menu=menus().find(item=>item.open);
    if(menu){event.preventDefault();menu.open=false;menu.querySelector('summary').focus();}
  });
}
