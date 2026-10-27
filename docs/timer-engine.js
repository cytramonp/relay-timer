// Pure clock mechanics shared by the standalone timers and their tests.
export const clamp = (value, min, max, fallback = min) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : fallback));
export const seconds = value => clamp(value, 0, 86400);
export function formatTime(ms, tenths = false) {
  const s = tenths ? Math.max(0, ms) / 1000 : Math.ceil(Math.max(0, ms) / 1000);
  const whole = Math.floor(s), h = Math.floor(whole / 3600), m = Math.floor(whole / 60) % 60;
  return `${h ? `${h}:` : ''}${h ? String(m).padStart(2, '0') : m}:${String(whole % 60).padStart(2, '0')}${tenths ? `.${Math.floor(s % 1 * 10)}` : ''}`;
}
export function buildSequence(kind, config) {
  const c = config, out = [];
  const add = (name, duration, type, round = 0, set = 1) => {
    const ms = Math.round(seconds(duration) * 1000);
    if (ms > 0) out.push({ name: String(name).slice(0, 100), ms, type, round, set });
  };
  const rounds = Math.floor(clamp(c.rounds, 1, 99, 3));
  if (kind === 'pomodoro') {
    for (let r = 1; r <= rounds; r++) {
      add(c.task || 'Focus', c.work, 'work', r);
      if (r < rounds || c.finalBreak) add(r % clamp(c.longEvery, 1, 99, 4) === 0 ? 'Long break' : 'Short break', r % clamp(c.longEvery, 1, 99, 4) === 0 ? c.longRest : c.rest, 'rest', r);
    }
  } else if (kind === 'boxing' || kind === 'fitness') {
    add('Get ready', c.prepare, 'prepare');
    const sets = kind === 'fitness' ? Math.floor(clamp(c.sets, 1, 20, 1)) : 1;
    for (let s = 1; s <= sets; s++) for (let r = 1; r <= rounds; r++) {
      const custom = c.customRounds ? c.overrides?.[r - 1] : null;
      add(custom?.name || (kind === 'boxing' ? `Round ${r}` : `Work ${r}`), custom?.work ?? c.work, 'work', r, s);
      if (r < rounds) add('Rest', custom?.rest ?? c.rest, 'rest', r, s);
      else if (s < sets) add('Set recovery', c.setRest, 'rest', r, s);
    }
    add('Cool down', c.cooldown, 'cooldown');
  } else {
    add(c.task || (kind === 'classroom' ? 'Activity time' : 'Countdown'), c.duration, 'work');
  }
  return out;
}

export class IntervalClock {
  constructor(sequence = [], automatic = true) { this.sequence = sequence; this.automatic = automatic; this.reset(); }
  reset() { this.index = 0; this.elapsed = 0; this.anchor = null; this.running = false; this.done = false; this.waiting = false; }
  start(now) { if (this.done || !this.sequence.length || this.waiting) return; this.anchor = now; this.running = true; }
  pause(now) { this.update(now); this.running = false; this.anchor = null; }
  update(now) {
    if (this.running && this.anchor !== null) { this.elapsed += Math.max(0, now - this.anchor); this.anchor = Math.max(now, this.anchor); }
    const changed = [];
    while (!this.done && this.sequence.length && this.elapsed >= this.sequence[this.index].ms) {
      if (!this.automatic && this.index < this.sequence.length - 1) {
        this.elapsed = this.sequence[this.index].ms; this.waiting = true; this.running = false; this.anchor = null; break;
      }
      this.elapsed -= this.sequence[this.index].ms;
      if (this.index === this.sequence.length - 1) { this.done = true; this.running = false; this.elapsed = 0; this.anchor = null; break; }
      this.index++; changed.push(this.index);
    }
    return changed;
  }
  next(now) {
    this.update(now);
    if (this.done) return;
    if (this.index === this.sequence.length - 1) { this.done = true; this.running = false; this.anchor = null; this.elapsed = 0; return; }
    this.index++; this.elapsed = 0; this.waiting = false; this.anchor = this.running ? now : null;
  }
  remaining() { return this.done ? 0 : Math.max(0, (this.sequence[this.index]?.ms || 0) - this.elapsed); }
  extend(ms) { if (!this.done && this.sequence[this.index]) this.sequence[this.index].ms = Math.max(1000, this.sequence[this.index].ms + ms); }
  snapshot() { return { index: this.index, elapsed: this.elapsed, done: this.done, waiting: this.waiting }; }
  restore(saved) {
    this.index = Math.floor(clamp(saved?.index, 0, Math.max(0, this.sequence.length - 1)));
    this.elapsed = clamp(saved?.elapsed, 0, this.sequence[this.index]?.ms || 0);
    this.done = saved?.done === true; this.waiting = saved?.waiting === true;
    this.running = false; this.anchor = null;
  }
}

export class ChessClock {
  constructor(secondsPerSide = 300, increment = 0, delay = 0) {
    this.initial = clamp(secondsPerSide, 1, 86400, 300) * 1000;
    this.increment = seconds(increment) * 1000; this.delay = seconds(delay) * 1000; this.reset();
  }
  reset() { this.times = [this.initial, this.initial]; this.moves = [0, 0]; this.active = 0; this.running = false; this.anchor = null; this.delayLeft = this.delay; this.flag = null; }
  start(now) { if (this.flag !== null) return; this.running = true; this.anchor = now; }
  update(now) {
    if (!this.running) return;
    const delta = Math.max(0, now - this.anchor); this.anchor = Math.max(now, this.anchor);
    const charged = Math.max(0, delta - this.delayLeft); this.delayLeft = Math.max(0, this.delayLeft - delta);
    this.times[this.active] = Math.max(0, this.times[this.active] - charged);
    if (!this.times[this.active]) { this.flag = this.active; this.running = false; this.anchor = null; }
  }
  pause(now) { this.update(now); this.running = false; this.anchor = null; }
  switch(now) {
    if (!this.running) return false;
    this.update(now); if (this.flag !== null) return false;
    this.times[this.active] += this.increment; this.moves[this.active]++;
    this.active = 1 - this.active; this.delayLeft = this.delay; this.anchor = now; return true;
  }
}

export function newYearTarget(now, timeZone) {
  const parts = date => Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' }).formatToParts(date).map(p => [p.type, p.value]));
  const year = Number(parts(new Date(now)).year) + 1;
  const desired = Date.UTC(year, 0, 1);
  let target = desired;
  for (let i = 0; i < 4; i++) { const p = parts(new Date(target)); target += desired - Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second); }
  return { year, target };
}
