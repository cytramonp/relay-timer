const illustrations = ['multi-stopwatch','running-coach-timer','swimming-timer','circuit-training-timer','climbing-timer','sailing-start-timer','archery-timer','sports-scoreboard-timer','board-game-timer','debate-timer','exam-station-timer','speed-networking-timer','darkroom-timer','coffee-brewing-timer','bakery-timer','laboratory-timer','workshop-job-timer','escape-room-timer','skydiving-ground-timer',''];
export function timerArt(timer, className='') {
  if(timer.slug==='egg-timer')return `<span class="egg-thumb ${className}" aria-hidden="true"><i></i></span>`;
  const routines=['kitchen-timer','meditation-timer','tea-brewing-timer','toothbrushing-timer','breathing-timer','yoga-stretching-timer','speech-timer'];const slot=routines.indexOf(timer.slug);if(slot>=0)return `<span class="timer-art routine-art ${className}" style="background-position:${slot%4*100/3}% ${Math.floor(slot/4)*100}%" aria-hidden="true"></span>`;
  const index = illustrations.indexOf(timer.slug);
  if (index >= 0) return `<span class="timer-art specialty-art ${className}" style="background-position:${index%4*100/3}% ${Math.floor(index/4)*25}%" aria-hidden="true"></span>`;
  return `<span class="timer-art art-${timer.kind === 'custom' ? 'simple' : timer.kind} ${className}" aria-hidden="true"></span>`;
}
