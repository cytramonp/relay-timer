const paths = {
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
