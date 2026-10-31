export function createBoard(profile) {
  return Array.from({ length: profile.count }, (_, i) => ({
    name: `${profile.mode === "turn" ? "Player" : "Timer"} ${i + 1}`,
    stages: profile.stages.map((s) => ({ ...s })),
    index: 0,
    elapsed: 0,
    anchor: null,
    laps: [],
    done: false,
  }));
}
export const elapsed = (card, now) =>
  card.elapsed + (card.anchor === null ? 0 : Math.max(0, now - card.anchor));
export function settle(card, mode, now) {
  if (card.anchor === null || card.done || mode === "up") return card;
  if (elapsed(card, now) < card.stages[card.index].seconds * 1000) return card;
  let c = { ...card };
  let ms = elapsed(c, now);
  while (ms >= c.stages[c.index].seconds * 1000 && !c.done) {
    if (c.automatic === false && c.index < c.stages.length - 1) {
      c.elapsed = c.stages[c.index].seconds * 1000;
      c.anchor = null;
      c.waiting = true;
      return c;
    }
    ms -= c.stages[c.index].seconds * 1000;
    if (c.index === c.stages.length - 1) {
      c.done = true;
      c.anchor = null;
      c.elapsed = c.stages[c.index].seconds * 1000;
    } else {
      c.index++;
      c.elapsed = ms;
      c.anchor = now;
    }
  }
  return c;
}
export function act(board, index, action, mode, now) {
  let next = board.map((c) => settle(c, mode, now));
  if (index < 0 || index >= next.length) return next;
  if (mode === "turn" && (action === "toggle" || action === "next"))
    next = next.map((c, i) =>
      i === index ? c : { ...c, elapsed: elapsed(c, now), anchor: null },
    );
  const c = { ...next[index], laps: [...next[index].laps] };
  if (action === "toggle" && !c.done) {
    if (c.waiting) return next;
    c.elapsed = elapsed(c, now);
    c.anchor = c.anchor === null ? now : null;
    c.scheduledAt = null;
    c.hasStarted = true;
  }
  if (action === "pause") {
    c.elapsed = elapsed(c, now);
    c.anchor = null;
    c.scheduledAt = null;
  }
  if (action === "reset") {
    c.index = 0;
    c.elapsed = 0;
    c.anchor = null;
    c.done = false;
    c.waiting = false;
    c.laps = [];
    c.hasStarted = false;
    c.lapOffset = 0;
    c.lapBase = 0;
    c.scheduledAt = null;
  }
  if (action === "lap" && c.anchor !== null) {
    c.laps.push(elapsed(c, now));
    if (c.laps.length > 500) {
      c.lapBase = c.laps.shift();
      c.lapOffset = (c.lapOffset || 0) + 1;
    }
  }
  if (action === "next") {
    if (mode === "turn") {
      c.elapsed = elapsed(c, now);
      c.anchor = null;
      next[index] = c;
      for (let step = 1; step <= next.length; step++) {
        const target = (index + step) % next.length;
        if (!next[target].done) {
          next[target] = { ...next[target], anchor: now };
          break;
        }
      }
      return next;
    }
    if (!c.done) {
      if (c.index < c.stages.length - 1) {
        c.index++;
        c.waiting = false;
        c.elapsed = 0;
        if (c.anchor !== null) c.anchor = now;
      } else {
        c.done = true;
        c.elapsed = c.stages[c.index].seconds * 1000;
        c.anchor = null;
      }
    }
  }
  if (action === "add" || action === "subtract") {
    c.stages = c.stages.map((s, i) =>
      i === c.index
        ? {
            ...s,
            seconds: Math.max(1, s.seconds + (action === "add" ? 60 : -60)),
          }
        : s,
    );
  }
  next[index] = c;
  return next.map((x) => settle(x, mode, now));
}
export function seekCard(card, seconds, mode) {
  const c = {
    ...card,
    anchor: null,
    scheduledAt: null,
    done: false,
    waiting: false,
    index: 0,
    elapsed: 0,
  };
  let remaining = Math.max(0, Number(seconds) || 0) * 1000;
  if (mode === "up") {
    c.elapsed = remaining;
    c.laps = c.laps.filter((v) => v <= remaining);
    if (remaining < (c.lapBase || 0)) {
      c.lapBase = 0;
      c.lapOffset = 0;
    }
    return c;
  }
  while (
    c.index < c.stages.length - 1 &&
    remaining >= c.stages[c.index].seconds * 1000
  ) {
    remaining -= c.stages[c.index].seconds * 1000;
    c.index++;
  }
  c.elapsed = Math.min(remaining, c.stages[c.index].seconds * 1000);
  c.done =
    c.index === c.stages.length - 1 &&
    c.elapsed >= c.stages[c.index].seconds * 1000;
  return c;
}
export function display(card, mode, now) {
  const ms =
    mode === "up"
      ? elapsed(card, now)
      : card.done
        ? 0
        : Math.max(
            0,
            card.stages[card.index].seconds * 1000 - elapsed(card, now),
          );
  const s = mode === "up" ? Math.floor(ms / 1000) : Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
