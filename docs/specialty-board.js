import { specialtyTimers } from "./specialty-catalog.js";
import { createBoard, act, settle, display, elapsed } from "./board-engine.js";
const profile = specialtyTimers.find(
  (t) => t.slug === document.body.dataset.timerSlug,
);
const root = document.querySelector("#specialty-board");
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let board = createBoard(profile),
  sound = false,
  audio;
const key = `corptimer.board.${profile.slug}`;
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (
    Array.isArray(saved) &&
    saved.length > 0 &&
    saved.length <= 12 &&
    saved.every(
      (c) =>
        typeof c.name === "string" &&
        Array.isArray(c.stages) &&
        c.stages.length &&
        c.stages.every(
          (s) =>
            typeof s.name === "string" &&
            Number.isFinite(s.seconds) &&
            s.seconds >= 0,
        ) &&
        Number.isInteger(c.index) &&
        c.index >= 0 &&
        c.index < c.stages.length &&
        Number.isFinite(c.elapsed) &&
        Array.isArray(c.laps),
    )
  )
    board = saved.map((c) => ({ ...c, anchor: null }));
} catch {}
function save() {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(
        board.map((c) => ({
          ...c,
          elapsed: elapsed(c, Date.now()),
          anchor: null,
        })),
      ),
    );
  } catch {
    document.querySelector("#board-note").textContent =
      "Browser storage is unavailable. Keep this page open to retain the session.";
  }
}
function render() {
  root.innerHTML = board
    .map(
      (c, i) =>
        `<section class="board-card"><label>Participant, station or batch<input data-name="${i}" maxlength="80" value="${escape(c.name)}"></label><h2 id="phase-${i}"></h2><div class="board-time" id="time-${i}" role="timer"></div><p id="state-${i}"></p><div class="board-actions">${[
          ["toggle", "Start / Pause"],
          ["pause", "Stop"],
          [
            profile.mode === "up" ? "lap" : "next",
            profile.mode === "up"
              ? "Lap"
              : profile.mode === "turn"
                ? "Next player"
                : "Next stage",
          ],
          ["reset", "Reset"],
          ...(profile.mode === "up"
            ? []
            : [
                ["add", "+1 minute"],
                ["subtract", "−1 minute"],
              ]),
        ]
          .map(
            ([a, l]) =>
              `<button data-action="${a}" data-index="${i}" type="button">${l}</button>`,
          )
          .join(
            "",
          )}</div><details><summary>Edit stages & lap record</summary><p>Pause or reset this clock to edit. Durations are in seconds.</p>${c.stages.map((s, j) => `<div class="board-stage"><label>Stage<input data-stage="${i}:${j}:name" maxlength="80" value="${escape(s.name)}"></label>${profile.mode === "up" ? "" : `<label>Seconds<input type="number" min="1" max="86400" data-stage="${i}:${j}:seconds" value="${s.seconds}"></label>`}</div>`).join("")}<ol id="laps-${i}">${c.laps.map((ms, j) => `<li>Lap ${j + 1}: ${(ms / 1000).toFixed(2)} s total · ${((ms - (c.laps[j - 1] || 0)) / 1000).toFixed(2)} s split</li>`).join("")}</ol></details></section>`,
    )
    .join("");
  tick();
}
function tick() {
  const now = Date.now();
  let changed = false;
  board = board.map((c, i) => {
    const n = settle(c, profile.mode, now);
    if (n.index !== c.index || n.done !== c.done) {
      changed = true;
      if (sound && audio) {
        const o = audio.createOscillator(),
          g = audio.createGain();
        o.connect(g);
        g.connect(audio.destination);
        g.gain.value = 0.08;
        o.start();
        o.stop(audio.currentTime + 0.2);
      }
      document.querySelector("#board-note").textContent =
        `${n.name}: ${n.done ? "Finished" : n.stages[n.index].name}`;
    }
    document.querySelector(`#time-${i}`).textContent = display(
      n,
      profile.mode,
      now,
    );
    document.querySelector(`#phase-${i}`).textContent = n.stages[n.index].name;
    document.querySelector(`#state-${i}`).textContent = n.done
      ? "Finished"
      : n.anchor === null
        ? "Paused / ready"
        : "Running";
    return n;
  });
  if (changed) save();
}
root.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  board = act(
    board,
    Number(b.dataset.index),
    b.dataset.action,
    profile.mode,
    Date.now(),
  );
  save();
  render();
});
root.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.name !== undefined)
    board[Number(el.dataset.name)].name = el.value.slice(0, 80);
  if (el.dataset.stage) {
    const [i, j, field] = el.dataset.stage.split(":");
    if (board[i].anchor !== null || board[i].done) {
      render();
      return;
    }
    if (field === "name") board[i].stages[j].name = el.value.slice(0, 80);
    else if (Number.isFinite(+el.value) && +el.value >= 1 && +el.value <= 86400)
      board[i].stages[j].seconds = +el.value;
    else {
      render();
      return;
    }
  }
  save();
  tick();
});
document.querySelector("#board-start").onclick = () => {
  const now = Date.now();
  board = board.map((c) => settle(c, profile.mode, now));
  board = board.map((c, i) => ({
    ...c,
    elapsed: elapsed(c, now),
    anchor: !c.done && (profile.mode !== "turn" || i === 0) ? now : null,
  }));
  save();
  render();
};
document.querySelector("#board-pause").onclick = () => {
  const now = Date.now();
  board = board.map((_, i) => act(board, i, "pause", profile.mode, now)[i]);
  save();
  render();
};
document.querySelector("#board-add").onclick = () => {
  if (board.length >= 12) return;
  board.push({
    ...createBoard({ ...profile, count: 1 })[0],
    name: `Timer ${board.length + 1}`,
  });
  save();
  render();
};
document.querySelector("#board-sound").onclick = async () => {
  try {
    audio ??= new AudioContext();
    await audio.resume();
    sound = !sound;
    document.querySelector("#board-sound").textContent = sound
      ? "Sound on"
      : "Enable sound";
  } catch {
    document.querySelector("#board-note").textContent =
      "Sound is unavailable in this browser.";
  }
};
document.querySelector("#board-fullscreen").onclick = () => {
  root.requestFullscreen?.().catch(() => {
    document.querySelector("#board-note").textContent =
      "Fullscreen is unavailable. Use your browser zoom controls.";
  });
};
document.querySelector("#board-export").onclick = () => {
  const quote = (v) =>
    '"' +
    String(typeof v === "string" && /^[=+@-]/.test(v) ? "'" + v : v).replace(
      /"/g,
      '""',
    ) +
    '"';
  const lines = [
    ["Name", "Stage", "Elapsed seconds", "Lap", "Split seconds"],
    ...board.flatMap((c) => [
      [
        c.name,
        c.stages[c.index].name,
        (elapsed(c, Date.now()) / 1000).toFixed(2),
        "",
        "",
      ],
      ...c.laps.map((v, i) => [
        c.name,
        "Lap",
        (v / 1000).toFixed(2),
        i + 1,
        ((v - (c.laps[i - 1] || 0)) / 1000).toFixed(2),
      ]),
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob([lines.map((r) => r.map(quote).join(",")).join("\r\n")], {
      type: "text/csv",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = profile.slug + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
render();
setInterval(tick, 100);
setInterval(save, 5000);
window.addEventListener("pagehide", save);
