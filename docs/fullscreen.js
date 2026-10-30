export async function toggleFullscreen(element, button) {
  if (document.fullscreenElement) { await document.exitFullscreen(); return; }
  if (element.classList.contains('screen-expanded')) { element.classList.remove('screen-expanded'); document.body.classList.remove('screen-open'); if(button)button.textContent='Fullscreen'; return; }
  try { if (!element.requestFullscreen) throw Error(); await element.requestFullscreen(); }
  catch { element.classList.add('screen-expanded'); document.body.classList.add('screen-open'); }
  if(button)button.textContent='Exit fullscreen';
}
if(typeof document !== 'undefined') {
  document.addEventListener('fullscreenchange',()=>{document.querySelectorAll('[data-fullscreen],#fullscreen-timer,#meeting-fullscreen').forEach(b=>b.textContent=document.fullscreenElement?.contains(b)?'Exit fullscreen':'Fullscreen');});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.screen-expanded').forEach(el=>el.classList.remove('screen-expanded'));document.body.classList.remove('screen-open');document.querySelectorAll('[data-fullscreen],#fullscreen-timer,#meeting-fullscreen').forEach(b=>b.textContent='Fullscreen');}});
}
