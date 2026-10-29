import {writeSetting,localSettings} from './timer-store.js';
import { timers as builtins } from "./timer-catalog.js?v=20";
const customTimers=localSettings().filter(r=>r.key.startsWith('corptimer.custom.')).map(r=>({slug:'custom:'+r.key.slice('corptimer.custom.'.length),title:JSON.parse(r.value).title}));
let timers=[...builtins,...customTimers];
const key = "corptimer.favorites.v1";
let prefs = { favorites: [], home: null };
try {
  const p = JSON.parse(localStorage.getItem(key));
  if (p && Array.isArray(p.favorites))
    prefs = {
      favorites: p.favorites.filter((s) => timers.some((t) => t.slug === s)),
      home: timers.some((t) => t.slug === p.home) ? p.home : null,
    };
} catch {}
const path = location.pathname.replace(/\/$/, "");
const current = timers.find((t) => t.slug.startsWith('custom:') ? path.endsWith('/custom-timer') && new URLSearchParams(location.search).get('id')===t.slug.slice(7) :
  t.slug
    ? path.endsWith("/" + t.slug)
    : path === "" || path.endsWith("/index.html"),
);
const href = (t) =>
  new URL(
    t.slug.startsWith('custom:') ? 'custom-timer/?id='+encodeURIComponent(t.slug.slice(7)) : t.slug ? t.slug + '/' : './',
    new URL('./',import.meta.url),
  ).href;
if (
  current?.slug === "" &&
  prefs.home &&
  new URLSearchParams(location.search).get("home") !== "meeting"
)
  location.replace(href(timers.find((t) => t.slug === prefs.home)));
const panel = document.createElement("section");
panel.className = "favorite-panel";
panel.setAttribute("aria-label", "Favorite timers");
const heading = document.querySelector(".tool-heading");
if (heading) heading.insertAdjacentElement("afterend", panel);
else {
  document
    .querySelector(".app-header")
    ?.insertAdjacentElement("afterend", panel);
  panel.classList.add("meeting-favorites");
}

function save() {
  try {
    writeSetting(key, prefs);
  } catch {
    panel.append(" Preferences cannot be saved in this browser.");
  }
}
function draw() {
  panel.replaceChildren();
  let actions=document.querySelector('.title-preferences');if(!actions){actions=document.createElement('span');actions.className='title-preferences';let title=document.querySelector('.meeting-title-group');if(!title){const h=document.querySelector('.tool-heading h1');if(h){title=h.closest('.timer-title-line');if(!title){title=document.createElement('div');title.className='timer-title-line';h.before(title);title.append(h);}}}title?.append(actions);}actions.replaceChildren();
  if (current) {
    for (const [label, fn] of [
      [
        prefs.favorites.includes(current.slug)
          ? "Remove favorite"
          : "Add to favorites",
        () => {
          prefs.favorites = prefs.favorites.includes(current.slug)
            ? prefs.favorites.filter((s) => s !== current.slug)
            : [...prefs.favorites, current.slug];
          save();
          draw();
          const message=document.createElement('div');message.className='favorite-message';message.role='status';message.textContent=prefs.favorites.includes(current.slug)?'Added to favorites':'Removed from favorites';document.body.append(message);setTimeout(()=>message.remove(),1800);
        },
      ],
      [
        prefs.home === current.slug ? "Clear start timer" : "Make start timer",
        () => {
          prefs.home = prefs.home === current.slug ? null : current.slug;
          save();
          draw();
        },
      ],
    ]) {
      const b = document.createElement("button");
      if(label==='Add to favorites'||label==='Remove favorite'){
        b.className='favorite-star';b.title=label;b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(prefs.favorites.includes(current.slug)));b.innerHTML='<svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1 6.2-5.6-3-5.6 3 1-6.2L3 9.6l6.2-.9Z"/></svg>';
      }else{b.textContent=label;b.className='start-preference';}
      b.onclick = fn;
      actions.append(b);
    }
  }
  if (prefs.favorites.length) {
    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Favorites");
    for (const slug of prefs.favorites) {
      const t = timers.find((t) => t.slug === slug);if(!t)continue;const
        a = document.createElement("a");
      a.href = href(t) + (slug === "" ? "?home=meeting" : "");
      a.textContent = t.title;
      if (slug === current?.slug) a.setAttribute("aria-current", "page");
      nav.append(a);
    }
    panel.append(nav);
    if (
      prefs.favorites.length > 1 &&
      current &&
      prefs.favorites.includes(current.slug)
    ) {
      const index = prefs.favorites.indexOf(current.slug);
      for (const [label, delta] of [
        ["Previous favorite", -1],
        ["Next favorite", 1],
      ]) {
        const a = document.createElement("a"),
          slug =
            prefs.favorites[
              (index + delta + prefs.favorites.length) % prefs.favorites.length
            ];
        a.textContent = label;
        a.href =
          href(timers.find((t) => t.slug === slug)) +
          (slug === "" ? "?home=meeting" : "");
        panel.append(a);
      }
    }
  }
}
draw();

window.addEventListener('timer-settings-received',()=>{try{timers=[...builtins,...localSettings().filter(r=>r.key.startsWith('corptimer.custom.')).map(r=>({slug:'custom:'+r.key.slice('corptimer.custom.'.length),title:JSON.parse(r.value).title}))];const saved=JSON.parse(localStorage.getItem(key));if(saved?.favorites){prefs=saved;draw();}}catch{}});
