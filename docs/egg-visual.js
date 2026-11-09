// These are doneness illustrations, never a measurement of the egg in the pan.
export const eggStages = [
  ['raw', 'Heating · not ready', 'Translucent white · liquid yolk', '0:00'],
  ['runny', 'Runny yolk', 'Set white · flowing centre', '5:00'],
  ['soft', 'Soft yolk', 'Set white · thick, soft centre', '6:00'],
  ['jammy', 'Sticky yolk', 'Firm white · jam-like centre', '7:00'],
  ['set', 'Soft-set yolk', 'Mostly set · a small soft centre', '8:00'],
  ['hard', 'Hard-boiled', 'Firm white · fully set yolk', '10:00'],
];
export function eggStageIndex(card) {
  return card.done ? 5 : Math.min(4, Math.max(0, card.index));
}
export function eggSvg(stage) {
  const shell = '<path d="M80 10C52 10 24 55 24 96c0 36 24 55 56 55s56-19 56-55C136 55 108 10 80 10Z" fill="#fffaf0" stroke="#ba9b72" stroke-width="3"/>';
  const yolks = {
    raw: '<path d="M18 109C7 93 28 77 40 78c12-2 16-19 39-16 23-1 24 18 42 20 24 2 34 23 23 40-8 14-26 8-41 14-30 11-30-1-50 0-21 2-39-10-35-27Z" fill="#fff5d6" fill-opacity=".16" stroke="#d5c4a1" stroke-width="2" stroke-dasharray="5 4"/><ellipse cx="80" cy="96" rx="29" ry="27" fill="#ee9417" stroke="#ba5c12" stroke-width="2"/><path d="M62 87q4-13 19-12" fill="none" stroke="#fff4bb" stroke-width="6" stroke-linecap="round"/><path d="M29 105q-7-13 10-15M115 120q16 1 16-11" fill="none" stroke="#f8e9c4" stroke-width="2" stroke-linecap="round"/>',
    runny: shell + '<path d="M49 93c0-22 14-31 31-31s31 11 31 31c0 17-15 22-16 39v19c0 15-11 20-15 9-3-8 3-18-5-21-16-6-26-26-26-46Z" fill="#e98213" stroke="#c66a13" stroke-width="2"/><path d="M60 83q4-12 17-12" fill="none" stroke="#ffe4a0" stroke-width="5" stroke-linecap="round"/><path d="M85 119v21" stroke="#ffb936" stroke-width="4" stroke-linecap="round"/>',
    soft: shell + '<circle cx="80" cy="100" r="33" fill="#edb93c"/><path d="M58 100c0-18 10-25 22-25s24 9 22 26c-1 13-12 15-14 24-5 10-12 6-15-1-11-3-15-13-15-24Z" fill="#e98b17"/><path d="M68 87q5-7 13-6" fill="none" stroke="#ffd679" stroke-width="4" stroke-linecap="round"/>',
    jammy: shell + '<circle cx="80" cy="100" r="33" fill="#edc756"/><path d="M61 97q3-17 20-16 20 3 18 23-2 17-21 17-22-3-17-24" fill="#d99a24"/><path d="m72 95 9-4 8 8-6 12-12-6Z" fill="#e5ad36"/>',
    set: shell + '<circle cx="80" cy="100" r="33" fill="#f0cf67"/><circle cx="80" cy="100" r="12" fill="#dfae42"/><path d="m58 98 5-2m30 19 4-2m-20 11 4-1m-3-49 3 1" stroke="#d7b455" stroke-width="2" stroke-linecap="round"/>',
    hard: shell + '<circle cx="80" cy="100" r="33" fill="#f1d77d"/><path d="m65 83 5 2m18-2-3 4m-24 15 5-1m16-5 4 3m11 6-4 2m-21 4-4 4m15 5 4-2m-17 9 4 1" stroke="#c9a34b" stroke-width="2.5" stroke-linecap="round"/>',
  };
  return `<svg viewBox="0 0 160 174" aria-hidden="true" focusable="false">${yolks[stage] || yolks.raw}</svg>`;
}
export function eggVisualMarkup() {
  return '<figure class="egg-visual"><div class="egg-current" role="img"></div><figcaption class="egg-texture"></figcaption></figure>' +
    `<ol class="egg-milestones" aria-label="Egg doneness milestones">${eggStages.map(([key, label, , time]) => `<li data-egg-stage="${key}">${eggSvg(key)}<span>${label}</span><time>${time}</time></li>`).join('')}</ol>`;
}
export function updateEggVisual(card, state) {
  const index = eggStageIndex(state), [key, label, texture] = eggStages[index];
  const figure = card.querySelector('.egg-visual');
  if (figure.dataset.stage === key) return;
  figure.dataset.stage = key;
  const image = figure.querySelector('.egg-current');
  image.innerHTML = eggSvg(key);
  image.setAttribute('aria-label', `${label}: ${texture}`);
  figure.querySelector('figcaption').textContent = texture;
  card.querySelectorAll('[data-egg-stage]').forEach((el, i) => {
    if (i === index) el.setAttribute('aria-current', 'step');
    else el.removeAttribute('aria-current');
  });
}
