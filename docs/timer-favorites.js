import {writeSetting,localSettings} from './timer-store.js';
import { timers as builtins } from "./timer-catalog.js?v=16";
const customTimers=localSettings().filter(r=>r.key.startsWith('corptimer.custom.')).map(r=>({slug:'custom:'+r.key.slice('corptimer.custom.'.length),title:JSON.parse(r.value).title}));
const timers=[...builtins,...customTimers];
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
    new URL(
      document.body.dataset.timerSlug || path.endsWith("/timers")
        ? "../"
        : "./",
      location.href,
    ),
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
      b.textContent = label;
      b.onclick = fn;
      panel.append(b);
    }
  }
  if (prefs.favorites.length) {
    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Favorites");
    for (const slug of prefs.favorites) {
      const t = timers.find((t) => t.slug === slug),
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
