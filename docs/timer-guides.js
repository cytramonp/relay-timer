// Public, page-specific instructions. Rendered into HTML at build time.
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const guides = {
  meeting: {
    paragraphs: [
      'The CorpTimer Meeting Timer turns an agenda into a shared schedule. Add speakers, discussion topics or both, give each slot a duration and choose the total meeting length. Start with a template for a standup, retrospective, planning session or workshop, or build your own agenda.',
      'Slots end at milestones measured from the meeting start. If an 8-minute turn ends after 7 minutes, the next speaker gets that spare minute. An overrun uses time from later slots. Use Next speaker to hand over, Pause to stop the meeting clock and Undo to reverse the last switch. You can wait for the host at zero or enable automatic transitions.',
      'Float timer opens a compact display where the browser supports it. Share live creates an audience link; keep the host tab open. Notes and reports remain private. Meetings are saved in this browser, with optional Google sign-in for a synchronized meeting library.'
    ],
    advice: [
      'Name agenda slots after the decision or topic, so everyone can see what the current time is for.',
      'Reserve a closing slot for decisions and next actions before dividing time between speakers.',
      'Pin slots that need a fixed allocation; use Equal times when unfinished speakers and topics should share the remaining time equally.',
      'Test the floating display in your actual screen-sharing mode. A floating window is not necessarily visible to the audience.',
      'Put tangents in For later and export a session report when you need a record of planned and actual time.'
    ],
    question: 'Can I use the meeting timer without an account?',
    answer: 'Yes. Agenda editing, timing, templates and local saving work without signing in. Google sign-in is optional for syncing your private meeting library across devices.'
  },
  boxing: {
    paragraphs: [
      'This online boxing timer runs a sequence of preparation, work rounds, rest periods and an optional cool-down. Choose a 3 × 3-minute, 3 × 2-minute or 12 × 3-minute preset, then edit the number of rounds and each duration. All training durations are entered in seconds.',
      'Enable Set each round individually when drills need different timings. Give rounds names such as footwork, technique or bag work, and set a work duration and following rest for each. The timer inserts rest between rounds and omits rest after the last round.',
      'Choose the boxing gong, soft bell or digital beep, adjust volume and use Test sound. Warning sets a cue at a chosen number of seconds left in a work round; 60 means a one-minute warning and zero disables it. Final countdown sets the last few beeps. Automatic transitions keep the sequence moving; turn them off when the host should decide when to continue.'
    ],
    advice: [
      'Use preparation time to put your gloves on and get into position before the first round.',
      'Name individual rounds after drills so the next task is visible before the rest ends.',
      'Set a warning threshold shorter than your work round; try 60 seconds for a three-minute round.',
      'Check the gong on the device and speaker you will use. Keep the timer tab open throughout the session.',
      'Save a named setup for a repeat session, or export it to bring the same round plan to another device.'
    ]
  },
  fitness: {
    paragraphs: [
      'The fitness interval timer alternates work and recovery for a complete workout plan. Set rounds per set, the number of sets, preparation and cool-down. Rest controls recovery between rounds, while Set recovery controls the longer pause between sets. Individual round settings let you name movements and vary their durations.',
      'Tabata starts with eight 20-second work intervals separated by 10-second rests. HIIT starts with ten 40-second efforts and 20-second recoveries. EMOM creates ten one-minute intervals with no separate rest: finish your planned repetitions during the minute and use the remainder as recovery. AMRAP starts as one uninterrupted 20-minute work interval. These are editable timer presets, not personalized training recommendations.',
      'Press Start to run the plan, Pause when needed and Next interval to move ahead. Sounds, warning cues and automatic transitions are configurable. Save or export a setup to repeat the same timings later.'
    ],
    advice: [
      'Choose movements, equipment and an appropriate pace before starting the clock.',
      'Use preparation time to clear your space and check that the alarm is audible.',
      'Give circuits multiple sets when you need a separate, longer recovery between repeats.',
      'In EMOM mode, work and recovery share the same minute; do not add an extra rest interval unless you intend to change that structure.',
      'Use descriptive individual-round names when a circuit changes exercises.'
    ]
  },
  pomodoro: {
    paragraphs: [
      'This Pomodoro timer alternates focused work with planned breaks. The starting setup has four 25-minute focus sessions, 5-minute short breaks and a 15-minute long break after the fourth session. Focus, short break and long break are entered in minutes and can all be changed.',
      'Name the task, set the number of focus sessions and choose how often a long break appears. Include a break after the last session if you want a complete work-and-recovery sequence, or turn that option off to finish at the end of the last focus interval.',
      'Automatic transitions start the next interval when the current one ends. Turn them off if you prefer to decide when work or a break should begin. Pause preserves your place, and the interval plan shows what comes next. A saved setup keeps your chosen rhythm for another session.'
    ],
    advice: [
      'Choose one concrete task before pressing Start, such as outlining a page or reviewing one chapter.',
      'Keep a note for interruptions so you can return to them after the focus interval.',
      'Make breaks distinct from the task instead of filling them with another unfinished work item.',
      'Shorten or lengthen the focus interval to suit the task; 25 minutes is a starting point, not a requirement.',
      'Use manual transitions if a break needs to finish before you are ready to resume work.'
    ]
  },
  classroom: {
    paragraphs: [
      'The Classroom Timer is a single activity countdown for a lesson, independent work, group discussion or a transition. Enter an activity name and choose hours, minutes and seconds, or use a quick duration. The large clock and shrinking progress bar show the time remaining.',
      'Press Start when the activity begins, Pause when the room needs an interruption and add one minute if you want to extend the activity. Fullscreen makes the display easier to show to the class where the browser supports it. Show visual progress without numbers hides the digits while keeping the progress bar.',
      'Classroom mode starts with sound off. You can choose an alarm, volume, work-warning threshold and final countdown if the activity needs an audible cue. For a lesson with several timed speakers or agenda items, use the separate Meeting Timer and build an agenda.'
    ],
    advice: [
      'Name the activity after a clear action, such as Read the passage or Discuss in pairs.',
      'Explain the finish cue and what students should do next before starting.',
      'Keep sound off for quiet reading, or test a gentle cue before showing the display.',
      'Use the visual-only option when exact numbers would distract from the task.',
      'Leave time outside the activity countdown for instructions and collecting responses.'
    ]
  },
  chess: {
    paragraphs: [
      'The online chess timer gives White and Black independent clocks. Choose a time-control preset or enter starting time in hours, minutes and seconds. Select who moves first, then press Start match. Tap the active player clock after a move to stop that clock and start the opponent’s.',
      'Increment is added to the player’s remaining time after a completed move. Delay is a grace period at the beginning of each turn before that player’s time starts decreasing. The two settings are independent and can be used together. Pausing preserves unused delay for the current turn.',
      'Space switches players during a running match when focus is outside an input or button. Swap sides changes the visual arrangement without changing the clocks. Move counts track completed handoffs. When a player’s time reaches zero, both clocks stop; reset the match to play again.'
    ],
    advice: [
      'Agree the starting time, increment and delay before the first move.',
      'Place the device where both players can comfortably reach the active clock.',
      'Tap once after completing your move and check which clock is active.',
      'Pause for a genuine interruption instead of letting one player lose time while the game is stopped.',
      'Keep the page open and use a dedicated physical clock when your event requires one.'
    ]
  },
  stopwatch: {
    paragraphs: [
      'The online stopwatch measures elapsed time by counting up. Press Start to begin, Pause to freeze the reading and Resume to continue the same run. Paused time is excluded. Reset clears the elapsed time and lap list for a fresh measurement.',
      'Record a lap at each checkpoint. Split shows the time since the previous lap, while Total shows elapsed time from the start. You can tap Lap while running or press L when keyboard focus is outside a control. The display shows tenths of a second.',
      'Export CSV downloads the lap number, split seconds and cumulative elapsed seconds for review in a spreadsheet. The stopwatch and laps are saved in this browser; after a reload, the session returns paused. For a deadline that counts down to zero, choose Simple Timer instead.'
    ],
    advice: [
      'Decide what counts as the start and finish before measuring a task.',
      'Use laps for repeated attempts or checkpoints instead of resetting between every segment.',
      'Compare split times when intervals are comparable; use cumulative totals to understand the whole run.',
      'Export the lap list before clearing browser data or starting a run that replaces it.',
      'Treat browser timing as a practical everyday tool rather than certified precision measurement.'
    ]
  },
  simple: {
    paragraphs: [
      'The Simple Timer counts down from a duration you choose. Enter hours, minutes and seconds, from one second up to a total of 24 hours, or use a quick-duration button. Press Start to begin; the timer does not start merely because you opened the page.',
      'Pause freezes the countdown and Resume continues from the same remaining time. The +1 minute control extends the current countdown. Reset returns it to your configured duration so you can run the same task again. Change the duration before starting a fresh run.',
      'Choose an alarm, set volume and use Test sound before relying on the finish cue. Warning and Final countdown let you add earlier cues or disable them with zero. Fullscreen gives the clock more room where supported. Named setups and JSON export/import help you reuse a duration.'
    ],
    advice: [
      'Pick a duration that includes the task you want to finish, rather than several unrelated jobs.',
      'Check the sound and device volume before starting an activity away from the screen.',
      'Pause deliberately when you want to exclude an interruption from the countdown.',
      'Use +1 minute for a small extension, and Reset for a new run with the original duration.',
      'Keep the tab open; closing it ends reliable live alarm delivery.'
    ]
  },
  newyear: {
    paragraphs: [
      'The New Year Countdown shows days, hours, minutes and seconds until January 1 at midnight in your selected time zone. It starts with your browser’s time zone and also offers UTC, New York, Los Angeles, London, Paris, Dubai, Tokyo and Sydney.',
      'Choose the place whose celebration you want to follow and read the target date and time zone beneath the countdown. The target is local midnight in that zone, not midnight in every viewer’s location. A change of zone can therefore change both the remaining time and which year is next.',
      'The countdown follows your device clock. Enable midnight alarm unlocks sound for the open tab; choose an audible sound and volume first. At the target, the page shows a New Year greeting. You can then choose to count down to the following year.'
    ],
    advice: [
      'Confirm the displayed city or zone before sharing a screen with people in other locations.',
      'Check that the device clock is correct before using the countdown for a group celebration.',
      'Enable and test the alarm in advance; the tab needs to remain open.',
      'Use fullscreen for a room display and keep the device connected to power for a long event.',
      'For a short toast or activity countdown, use a minute timer instead of changing the New Year target.'
    ]
  }
};
const durationIdeas = {
  5: { task:'a short pause or a small finishing task', examples:'clearing your desk, collecting ideas, preparing to leave or taking a brief pause', advice:['Pick one small action that can fit into five minutes.', 'Use a one-minute warning if you want time to wrap up before zero.', 'For a quick idea sprint, write first and review the ideas after the countdown.'] },
  10: { task:'a short activity with a clear finish', examples:'reading a few pages, tidying a room, practicing a passage or running a short group exercise', advice:['Define the result you want at the end of ten minutes before pressing Start.', 'For pair work, leave a little time after the timer for each pair to report back.', 'If you repeat the same activity, reset the countdown instead of re-entering the duration.'] },
  15: { task:'a compact block of focused work', examples:'reviewing a document, preparing meeting notes, reading or working through a practice exercise', advice:['Write down one outcome for this 15-minute block.', 'Keep preparation outside the countdown if you want all fifteen minutes for the activity.', 'For a meeting with several people, use Meeting Timer to divide time between agenda items.'] },
  20: { task:'an uninterrupted activity or practice block', examples:'working on a draft, independent classroom work, practicing a skill or a longer reading exercise', advice:['Gather the materials you need before the 20-minute countdown starts.', 'Choose a warning near the end if you need a separate wrap-up step.', 'If the task is a workout with repeated efforts and rests, use Fitness Timer for its interval controls.'] },
  25: { task:'a single focus session', examples:'studying a topic, drafting a section, solving a problem or completing one Pomodoro-style work interval', advice:['Choose one task and keep unrelated tasks on a note for later.', 'Plan a break after this focus block; this page is a single countdown and does not start a break automatically.', 'Use Pomodoro Timer when you want repeated focus sessions with short and long breaks.'] },
  30: { task:'a longer work or activity session', examples:'a study block, a writing session, quiet reading or a half-hour independent task', advice:['Break the task into a few checkpoints before starting the half-hour countdown.', 'Make room for a final review or wrap-up within the thirty minutes.', 'For several speakers or discussion stages, choose Meeting Timer rather than dividing the time mentally.'] }
};
export function guideFor(timer) {
  if (!timer.minutes) return { ...guides[timer.kind], question:guides[timer.kind].question || timer.faq?.[0], answer:guides[timer.kind].answer || timer.faq?.[1] };
  const m=timer.minutes, idea=durationIdeas[m];
  return {
    paragraphs:[
      `This ${m} minute timer is preset to ${m}:00 for ${idea.task}. It is useful for ${idea.examples}. Open the page, check the duration and press Start when you are ready. Opening the page alone does not start the countdown.`,
      `Pause freezes the time remaining, and Resume continues the same run. Add one minute if the activity needs a small extension, or Reset to return to your configured duration. The initial duration on this page is ${m} minutes; if you save or edit the setup, this browser can restore that different duration on your next visit.`,
      `Choose an alarm and volume, then use Test sound to check the finish cue. You can set a warning in seconds left and a final sequence of countdown beeps; zero disables either cue. Fullscreen makes the countdown easier to read from a distance where your browser supports it. Keep the tab open for a live alarm.`
    ],
    advice:[...idea.advice,'Test the alarm on the actual device you will use, and export a setup if you want it on another device.'],
    question:`How do I restart the ${m} minute countdown?`,
    answer:`Press Reset to stop the current run and return to the duration in your setup, then press Start. If you changed the setup, choose ${m} min first to restore this page’s original preset.`
  };
}
export function renderTimerGuide(timer) {
  const guide=guideFor(timer);
  return `<details class="timer-guide"><summary>How it works and advice<span class="guide-toggle" aria-hidden="true"></span></summary><div class="guide-content"><section><h2>How the ${escape(timer.title)} works</h2>${guide.paragraphs.map(p=>`<p>${escape(p)}</p>`).join('')}</section><section><h2>Advice for using the ${escape(timer.title)}</h2><ul>${guide.advice.map(p=>`<li>${escape(p)}</li>`).join('')}</ul></section><section class="guide-questions"><h2>Useful details</h2><h3>${escape(guide.question)}</h3><p>${escape(guide.answer)}</p>${timer.kind!=='meeting'?'<h3>Are settings synchronized with my meeting account?</h3><p>These standalone tools keep their own settings and saved setups in this browser. They do not use Google/Firebase meeting synchronization. Export and import a setup to transfer it to another device.</p>':''}<h3>Will this timer work if I close the page?</h3><p>Keep the timer tab open. Browsers can suspend background tabs, especially on phones. Elapsed time is recalculated when the page resumes, but an alarm at the exact deadline cannot be guaranteed. Reloaded interval, stopwatch and chess sessions return paused; the New Year countdown follows its selected date and time zone.</p></section></div></details>`;
}
