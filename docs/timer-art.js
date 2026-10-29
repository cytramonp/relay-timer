const illustrations = ['multi-stopwatch','running-coach-timer','swimming-timer','circuit-training-timer','climbing-timer','sailing-start-timer','archery-timer','sports-scoreboard-timer','board-game-timer','debate-timer','exam-station-timer','speed-networking-timer','darkroom-timer','coffee-brewing-timer','bakery-timer','laboratory-timer','workshop-job-timer','escape-room-timer','skydiving-ground-timer',''];
export function timerArt(timer, className='') {
  if(timer.slug==='egg-timer')return `<span class="egg-thumb ${className}" aria-hidden="true"><i></i></span>`;
  const index = illustrations.indexOf(timer.slug);
  if (index >= 0) return `<span class="timer-art specialty-art ${className}" style="background-position:${index%4*100/3}% ${Math.floor(index/4)*25}%" aria-hidden="true"></span>`;
  return `<span class="timer-art art-${timer.kind === 'custom' ? 'simple' : timer.kind} ${className}" aria-hidden="true"></span>`;
}
