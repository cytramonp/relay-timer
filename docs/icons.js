const paths = {
  people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  loop:'M20 7h-8a5 5 0 0 0 0 10h8M17 4l3 3-3 3M4 17h5M7 14l-3 3 3 3',
  grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  spark:'m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2z',
  focus:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M12 8v4l3 2',
  coffee:'M4 8h12v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8zm12 1h2a3 3 0 0 1 0 6h-2M7 2v3m5-3v3',
  clock:'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  notes:'M6 3h12a2 2 0 0 1 2 2v10l-6 6H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm8 18v-6h6M8 8h8m-8 4h5',
  edit:'m16 3 5 5L9 20l-6 1 1-6L16 3zm-2 2 5 5',
  copy:'M8 8h13v13H8zM16 4V1H1v15h3',
  account:'M4 21v-2a8 8 0 0 1 16 0v2M17 7A5 5 0 1 1 7 7a5 5 0 0 1 10 0',
  undo:'M9 7H4V2M4 7a8 8 0 1 1-1 9',
  reset:'M20 7V2l-4 4M20 7a8 8 0 1 0 1 9',
  close:'m6 6 12 12M6 18 18 6',
  right:'M4 12h16m-6-6 6 6-6 6',
  up:'M12 20V4m-6 6 6-6 6 6',
  down:'M12 4v16m-6-6 6 6 6-6',
  outward:'M6 18 18 6M6 6h12v12',
  plus:'M12 5v14M5 12h14',
  check:'m5 12 4 4L19 6',
  more:'M5 12h.01M12 12h.01M19 12h.01',
  grip:'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01'
};
export function icon(name, doc = document) {
  const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('class','ui-icon');
  svg.setAttribute('fill','none'); svg.setAttribute('stroke','currentColor');
  svg.setAttribute('stroke-width','1.8'); svg.setAttribute('stroke-linecap','round'); svg.setAttribute('stroke-linejoin','round');
  svg.setAttribute('aria-hidden','true'); svg.setAttribute('focusable','false');
  const path=doc.createElementNS('http://www.w3.org/2000/svg','path'); path.setAttribute('d',paths[name]||paths.right); svg.append(path); return svg;
}

export function iconMarkup(name){return icon(name).outerHTML;}
