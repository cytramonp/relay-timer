import {byPopularity} from '../docs/timer-popularity.js';
import { timerArt } from '../docs/timer-art.js';
import fs from "node:fs";
import { specialtyTimers } from "../docs/specialty-catalog.js";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const category = (t) =>
  t.category ||
  (["boxing", "fitness"].includes(t.kind)
    ? "Sports"
    : t.kind === "meeting"
      ? "Professional"
      : t.kind === "classroom"
        ? "Learning & events"
        : "Everyday");
export function groupedDirectory(timers) {
  return ["Sports", "Professional", "Learning & events", "Everyday"]
    .map(
      (g) =>
        `<details class="directory-category" open><summary>${esc(g)} <span>${timers.filter((t) => category(t) === g).length} timers</span></summary><div class="directory-list">${timers
          .filter((t) => category(t) === g)
          .sort(byPopularity)
          .map(
            (t) =>
              `<a class="directory-link" href="../${t.slug ? t.slug + "/" : ""}">${timerArt(t,'directory-art')}<h3>${esc(t.title)}</h3><p>${esc(t.description)}</p><p class="directory-detail">${esc(t.detail)}</p></a>`,
          )
          .join("")}</div></details>`,
    )
    .join("");
}
export function buildSpecialtyPages(shell) {
  for (const t of specialtyTimers) {
    const image = `https://corptimer.com/assets/${t.slug}.png`;
    const body = `<div class="tool-heading illustrated-heading">${timerArt(t)}<h1>${esc(t.title)}</h1><p>${esc(t.description)}</p></div><div class="board-actions"><button id="board-start">${t.mode === "turn" ? "Start first player" : "Start all"}</button><button id="board-pause">Pause all</button><button id="board-add">Add clock</button><button id="board-export">Export CSV</button><button id="board-sound">Enable sound</button><button id="board-fullscreen">Fullscreen board</button></div><p id="board-note" role="status">Keep this page open. Clocks restore paused after a reload. Stage cues require sound enabled.</p><div id="specialty-board" class="specialty-board"></div><details class="timer-guide"><summary>How it works and advice</summary><div class="guide-content"><img class="specialty-diagram" src="../assets/${t.slug}.png" alt="${esc(t.title)} timing diagram: ${esc(t.stages.map((s) => s.name).join(" → "))}" width="1200" height="630"><h2>How the ${esc(t.title)} works</h2><p>${esc(t.description)}</p><h2>How to use it</h2><ol><li>${esc(t.use)}</li><li>Open Edit stages to name each phase and change its duration in seconds while the clock is paused. Each clock starts independently.</li><li>Pause to hold the current stage, use Next stage to finish early, or Reset to start that clock again. Export CSV for your elapsed times and lap splits.</li></ol>${t.slug==='egg-timer'?'<h2>Egg doneness milestones</h2><p>5 minutes: runny. 6: soft. 7: sticky. 8: soft-set. 10: hard-boiled. Start when large room-temperature eggs enter boiling water. These are cumulative times, not additional cooking intervals. Remove and cool at the milestone you prefer; the timer continues to show later options.</p><p>Timing reference: <a href="https://www.bbcgoodfood.com/howto/guide/how-boil-egg-perfectly" target="_blank" rel="noopener">Good Food egg boiling guide</a>. Cross-sections are illustrations, not measurements of the egg in your pan.</p>':''}<h2>Practical advice</h2><ul><li>${esc(t.tip)}</li><li>Test the setup before the session.</li></ul><p>Try one short test before your session. Keep the device awake and the tab visible; browser alarms are not guaranteed while the device is locked.</p><h2>Can I use this timer offline?</h2><p>The clocks run without a server after the page loads. Opening an uncached page still requires a connection. No account is required; this board stays in this browser.</p></div></details><section class="related-timers"><h2>More ${esc(t.category.toLowerCase())} timers</h2>${specialtyTimers
      .filter((x) => x.category === t.category && x.slug !== t.slug)
      .map((x) => `<a href="../${x.slug}/">${esc(x.title)}</a>`)
      .join(
        " · ",
      )}<p><a href="../timers/">Browse all timers</a></p></section><noscript>Enable JavaScript to operate this board. The instructions above remain available.</noscript>`;
    let html = shell({ ...t, body }).replace(
      '<script type="module" src="../special-timers.js?v=21"></script>',
      '<script type="module" src="../specialty-board.js?v=2"></script>',
    );
    html = html.replace(
      "</head>",
      `<meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${image}"></head>`,
    );
    fs.mkdirSync(`docs/${t.slug}`, { recursive: true });
    fs.writeFileSync(`docs/${t.slug}/index.html`, html);
    // A precise timing diagram, rather than a stock picture unrelated to operation.
    const colors = ["#17676b", "#c62d35", "#62635e", "#17676b"];
    const chartStages=t.slug==='breathing-timer'?t.stages.slice(0,2):t.stages;
    const w = 1040 / chartStages.length;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#eeece5"/><text x="80" y="110" font-family="Georgia" font-size="48" fill="#20211e">${esc(t.title)}</text><text x="80" y="165" font-family="Arial" font-size="24" fill="#62635e">${t.mode === "up" ? "Independent starts and lap checkpoints" : t.mode === "turn" ? "One active player. A time bank for everyone." : "Editable stages. Independent starts."}</text>${chartStages.map((s, i) => `<rect x="${80 + i * w}" y="270" width="${w - 12}" height="130" rx="8" fill="${colors[i % 4]}"/><text x="${96 + i * w}" y="320" font-family="Arial" font-size="${t.stages.length > 3 ? 22 : 28}" fill="#fff">${esc(s.name.length>18?s.name.slice(0,17)+'…':s.name)}</text><text x="${96 + i * w}" y="365" font-family="Arial" font-size="30" fill="#fff">${t.mode === "up" ? "0:00 →" : Math.floor(s.seconds / 60) + ":" + String(s.seconds % 60).padStart(2, "0")}</text>`).join("")}<text x="80" y="505" font-family="Arial" font-size="24" fill="#62635e">${t.count} ${t.count === 1 ? "clock" : "independent clocks"} · ${esc(t.category)} · CorpTimer</text><text x="80" y="550" font-family="Arial" font-size="20" fill="#62635e">Illustrative setup — edit timings to match your session.</text></svg>`;
    fs.writeFileSync(`docs/assets/${t.slug}.svg`, svg);
  }
}
