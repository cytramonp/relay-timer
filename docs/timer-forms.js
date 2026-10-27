export const defaults = {
  boxing: { rounds: 3, work: 180, rest: 60, prepare: 10, cooldown: 0, warning: 60, finalCue: 10, automatic: true, sound: 'gong', volume: 65, customRounds: false, overrides: [] },
  fitness: { rounds: 8, work: 20, rest: 10, sets: 1, setRest: 60, prepare: 10, cooldown: 0, warning: 0, finalCue: 3, automatic: true, sound: 'beep', volume: 60, customRounds: false, overrides: [] },
  pomodoro: { rounds: 4, work: 1500, rest: 300, longRest: 900, longEvery: 4, finalBreak: true, task: 'Time to focus', warning: 60, finalCue: 0, automatic: true, sound: 'bell', volume: 50 },
  classroom: { duration: 600, task: 'Independent work', warning: 60, finalCue: 0, automatic: true, sound: 'off', volume: 45, hideDigits: false },
  simple: { duration: 300, task: 'Time for your next thing', warning: 0, finalCue: 0, automatic: true, sound: 'bell', volume: 60 },
  chess: { duration: 300, increment: 3, delay: 0, first: '0', sound: 'beep', volume: 40 },
  stopwatch: { sound: 'off', volume: 40 },
  newyear: { zone: 'local', sound: 'bell', volume: 60 }
};
const number = (key, label, value, min = 0, max = 3600, step = 1) => `<label>${label}<input name="${key}" type="number" value="${value}" min="${min}" max="${max}" step="${step}" required></label>`;
const check = (key, label, checked) => `<label class="option-check"><input name="${key}" type="checkbox" ${checked ? 'checked' : ''}>${label}</label>`;
const select = (key, label, options) => `<label>${label}<select name="${key}">${options.map(([v,t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>`;
export function durationFields(duration) { return `<fieldset class="duration-fields"><legend>Countdown duration</legend>${number('hours','Hours',Math.floor(duration/3600),0,24)}${number('minutes','Minutes',Math.floor(duration/60)%60,0,59)}${number('seconds','Seconds',duration%60,0,59)}</fieldset>`; }
export function settingsMarkup(kind, minutes) {
  const c = { ...defaults[kind] }; if (minutes) c.duration = minutes * 60;
  let html = '';
  if (['boxing','fitness'].includes(kind)) {
    html += `<fieldset class="preset-buttons"><legend>Start with a preset</legend>${(kind === 'boxing' ? [['boxing','3 × 3 min'],['amateur','3 × 2 min'],['bag','12 × 3 min']] : [['tabata','Tabata'],['hiit','HIIT'],['emom','EMOM'],['amrap','AMRAP']]).map(([v,t],i)=>`<button type="button" class="preset-option" data-tone="${i%2?'teal':'red'}" data-preset="${v}" aria-pressed="false">${t}</button>`).join('')}</fieldset>`;
    html += `<div class="field-grid">${number('rounds',kind==='boxing'?'Rounds':'Rounds per set',c.rounds,1,99)}${number('work','Work · seconds',c.work,1,86400)}${number('rest','Rest · seconds',c.rest,0,86400)}${number('prepare','Get ready · seconds',c.prepare,0,3600)}${kind === 'fitness' ? number('sets','Sets',c.sets,1,20)+number('setRest','Set recovery · seconds',c.setRest,0,86400) : ''}${number('cooldown','Cool down · seconds',c.cooldown,0,86400)}</div>${check('customRounds','Set each round individually',false)}<div id="round-editor" hidden><p class="field-help">Work and rest are in seconds. Last-round rest is omitted; set recovery takes priority between sets.</p><div id="round-fields"></div></div>`;
  } else if (kind === 'pomodoro') {
    html += `<label>What are you working on?<input name="task" maxlength="100" value="Time to focus"></label><div class="field-grid">${number('work','Focus · minutes',25,1,240,.5)}${number('rest','Short break · minutes',5,0,120,.5)}${number('longRest','Long break · minutes',15,0,180,.5)}${number('longEvery','Long break every… sessions',4,1,99)}${number('rounds','Focus sessions',4,1,99)}</div>${check('finalBreak','Include a break after the last session',true)}`;
  } else if (kind === 'simple' || kind === 'classroom') {
    if (kind==='classroom') html += `<label>Activity name<input name="task" value="Independent work" maxlength="100"></label>`;
    html += durationFields(c.duration);
    html += `<div class="quick-durations" aria-label="Quick durations">${[5,10,15,20,25,30].map((m,i)=>`<button type="button" class="preset-option" data-tone="${i%2?'teal':'red'}" data-minutes="${m}" aria-pressed="false">${m} min</button>`).join('')}</div>`;
    if (kind==='classroom') html += check('hideDigits','Show visual progress without numbers',false);
  } else if (kind === 'chess') {
    html += `<fieldset class="preset-buttons"><legend>Time control</legend>${[['bullet','1 + 0'],['blitz','3 + 2'],['rapid','10 + 0'],['casual','15 + 10']].map(([v,t],i)=>`<button type="button" class="preset-option" data-tone="${i%2?'teal':'red'}" data-preset="${v}" aria-pressed="false">${t}</button>`).join('')}</fieldset>${durationFields(300)}<div class="field-grid">${number('increment','Increment · seconds',3,0,300)}${number('delay','Delay · seconds',0,0,300)}</div>${select('first','Who moves first?',[['0','White'],['1','Black']])}<p class="field-help">Increment is added after a move. Delay is free time at the start of each turn. Both can be used together.</p>`;
  } else if (kind === 'newyear') {
    html += select('zone','Celebrate midnight in…',[['local','My time zone'],['UTC','UTC'],['America/New_York','New York'],['America/Los_Angeles','Los Angeles'],['Europe/London','London'],['Europe/Paris','Paris'],['Asia/Dubai','Dubai'],['Asia/Tokyo','Tokyo'],['Australia/Sydney','Sydney']]);
  } else html += '<p class="field-help">Space starts and pauses the stopwatch. L records a lap while it is running. Download your results when you finish.</p>';
  if (!['stopwatch','chess','newyear'].includes(kind)) html += `<details class="cue-settings" open><summary>Sound & timing</summary><div class="field-grid">${number('warning','Warning · seconds left',c.warning,0,3600)}${number('finalCue','Final countdown · seconds',c.finalCue,0,30)}</div>${['boxing','fitness','pomodoro'].includes(kind) ? check('automatic','Move to the next interval automatically',true) : ''}<p class="field-help">Zero turns a cue off. Warnings apply to work intervals. Final beeps also count into the next interval.</p></details>`;
  html += `<div class="sound-settings">${select('sound','Alarm sound',[['gong','Boxing gong'],['bell','Soft bell'],['beep','Digital beep'],['off','Off']])}<label>Volume <output id="volume-value">${c.volume}%</output><input name="volume" type="range" min="0" max="100" value="${c.volume}"></label><button type="button" id="test-sound">Test sound</button></div>`;
  return html;
}
