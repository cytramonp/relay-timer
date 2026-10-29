export const specialtyTimers = [
  {
    "slug": "multi-stopwatch",
    "title": "Multi Stopwatch",
    "short": "Multi Stopwatch",
    "kind": "specialty",
    "category": "Sports",
    "mode": "up",
    "count": 6,
    "stages": [
      {
        "name": "Elapsed",
        "seconds": 0
      }
    ],
    "description": "Time six people independently, with individual starts, laps and finishes.",
    "use": "Label each participant before starting. Record a lap at each checkpoint.",
    "tip": "Use Start all for a common start; stop each participant separately.",
    "detail": "Independent starts · laps · export"
  },
  {
    "slug": "running-coach-timer",
    "title": "Running Coach Timer",
    "short": "Running Coach",
    "kind": "specialty",
    "category": "Sports",
    "mode": "sequence",
    "count": 6,
    "stages": [
      {
        "name": "Run",
        "seconds": 60
      },
      {
        "name": "Recovery",
        "seconds": 90
      }
    ],
    "description": "Manage independent running efforts and recovery for a group.",
    "use": "Start each athlete as they leave. Next stage records their finish and begins recovery.",
    "tip": "These sample intervals are editable, not a training prescription.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "swimming-timer",
    "title": "Swimming Timer",
    "short": "Swimming",
    "kind": "specialty",
    "category": "Sports",
    "mode": "up",
    "count": 6,
    "stages": [
      {
        "name": "Swim",
        "seconds": 0
      }
    ],
    "description": "Record elapsed times and lap splits across six swimming lanes.",
    "use": "Name cards after swimmers or lanes and tap Lap at each wall touch.",
    "tip": "Manual taps are practice measurements, not certified race timing.",
    "detail": "Independent starts · laps · export"
  },
  {
    "slug": "circuit-training-timer",
    "title": "Circuit Training Timer",
    "short": "Circuit Training",
    "kind": "specialty",
    "category": "Sports",
    "mode": "sequence",
    "count": 6,
    "stages": [
      {
        "name": "Work",
        "seconds": 40
      },
      {
        "name": "Recover",
        "seconds": 20
      }
    ],
    "description": "Run separate work and recovery clocks for training stations.",
    "use": "Name each station, edit its work and recovery and start individually or together.",
    "tip": "Repeat a station with Reset. This board does not coordinate remote screens.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "climbing-timer",
    "title": "Climbing Timer",
    "short": "Climbing",
    "kind": "specialty",
    "category": "Sports",
    "mode": "sequence",
    "count": 4,
    "stages": [
      {
        "name": "Attempt",
        "seconds": 240
      },
      {
        "name": "Rest",
        "seconds": 240
      }
    ],
    "description": "Keep climbing attempts and rest periods visible for several climbers.",
    "use": "Assign a climber or route to each card. Advance early when an attempt ends.",
    "tip": "Agree the attempt and rest limits with the event organizer.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "sailing-start-timer",
    "title": "Sailing Start Timer",
    "short": "Sailing Start",
    "kind": "specialty",
    "category": "Sports",
    "mode": "sequence",
    "count": 1,
    "stages": [
      {
        "name": "Five-minute start",
        "seconds": 300
      }
    ],
    "description": "Practice a regatta start with an editable visual countdown.",
    "use": "Set the countdown to match the starting signal, then press Start at that signal.",
    "tip": "This is a manual countdown. It has no GPS, line-distance or race-signal integration.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "archery-timer",
    "title": "Archery Timer",
    "short": "Archery",
    "kind": "specialty",
    "category": "Sports",
    "mode": "sequence",
    "count": 2,
    "stages": [
      {
        "name": "Prepare",
        "seconds": 20
      },
      {
        "name": "Shoot",
        "seconds": 120
      },
      {
        "name": "Change group",
        "seconds": 20
      }
    ],
    "description": "Show preparation, shooting and changeover periods for archery practice.",
    "use": "Label each shooting group and edit every stage to match your session.",
    "tip": "The presets are examples; follow the rules and signals of your range.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "sports-scoreboard-timer",
    "title": "Sports Timekeeper",
    "short": "Sports Timekeeper",
    "kind": "specialty",
    "category": "Sports",
    "mode": "sequence",
    "count": 4,
    "stages": [
      {
        "name": "Game",
        "seconds": 1200
      }
    ],
    "description": "Keep game, attack, timeout and penalty countdowns on one board.",
    "use": "Rename the four clocks and set a separate duration for each role.",
    "tip": "Clocks are independent. Pause all stops the board; penalties are not linked automatically.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "board-game-timer",
    "title": "Multiplayer Board Game Timer",
    "short": "Multiplayer Board Game",
    "kind": "specialty",
    "category": "Learning & events",
    "mode": "turn",
    "count": 6,
    "stages": [
      {
        "name": "Time bank",
        "seconds": 600
      }
    ],
    "description": "Give up to six players their own time bank and pass the turn.",
    "use": "Set player names and time banks. Start a player and use Next player to hand over.",
    "tip": "Only one clock runs in turn mode. There are no increments or elimination rules.",
    "detail": "Personal time banks · turn handoff"
  },
  {
    "slug": "debate-timer",
    "title": "Debate Timer",
    "short": "Debate",
    "kind": "specialty",
    "category": "Learning & events",
    "mode": "sequence",
    "count": 2,
    "stages": [
      {
        "name": "Opening",
        "seconds": 240
      },
      {
        "name": "Response",
        "seconds": 240
      },
      {
        "name": "Closing",
        "seconds": 120
      }
    ],
    "description": "Run editable speech sequences for two sides of a practice debate.",
    "use": "Name the sides and edit the order and length of speeches before starting.",
    "tip": "These are practice stages, not an official debate-format ruleset.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "exam-station-timer",
    "title": "Exam Station Timer",
    "short": "Exam Station",
    "kind": "specialty",
    "category": "Learning & events",
    "mode": "sequence",
    "count": 6,
    "stages": [
      {
        "name": "Task",
        "seconds": 480
      },
      {
        "name": "Move",
        "seconds": 60
      }
    ],
    "description": "Track task and transition time for parallel exam stations.",
    "use": "Name each station and set task and transition durations. Start together for a synchronized round.",
    "tip": "Reset for the next round. Remote room displays are not synchronized by this board.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "speed-networking-timer",
    "title": "Speed Networking Timer",
    "short": "Speed Networking",
    "kind": "specialty",
    "category": "Learning & events",
    "mode": "sequence",
    "count": 1,
    "stages": [
      {
        "name": "Conversation",
        "seconds": 300
      },
      {
        "name": "Change partner",
        "seconds": 30
      }
    ],
    "description": "Keep networking conversations and partner changeovers on schedule.",
    "use": "Edit conversation and transition time. Reset to begin the next round.",
    "tip": "Pairing and rotation are managed by the host, not assigned automatically.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "darkroom-timer",
    "title": "Darkroom Timer",
    "short": "Darkroom",
    "kind": "specialty",
    "category": "Professional",
    "mode": "sequence",
    "count": 3,
    "stages": [
      {
        "name": "Develop",
        "seconds": 300
      },
      {
        "name": "Stop bath",
        "seconds": 30
      },
      {
        "name": "Fix",
        "seconds": 300
      },
      {
        "name": "Wash",
        "seconds": 600
      }
    ],
    "description": "Follow separate development sequences for photographic batches.",
    "use": "Label batches and replace every example duration with your chemistry instructions.",
    "tip": "No agitation cues are included. Screen light may affect light-sensitive materials.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "coffee-brewing-timer",
    "title": "Coffee Brewing Timer",
    "short": "Coffee Brewing",
    "kind": "specialty",
    "category": "Everyday",
    "mode": "sequence",
    "count": 1,
    "stages": [
      {
        "name": "Bloom",
        "seconds": 30
      },
      {
        "name": "First pour",
        "seconds": 30
      },
      {
        "name": "Draw down",
        "seconds": 120
      }
    ],
    "description": "Follow an editable bloom, pour and draw-down sequence for coffee.",
    "use": "Enter stage names with your intended water amounts and set their durations.",
    "tip": "Use a scale for water amounts. The timer does not measure weight or temperature.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "bakery-timer",
    "title": "Bakery Batch Timer",
    "short": "Bakery Batch",
    "kind": "specialty",
    "category": "Professional",
    "mode": "sequence",
    "count": 6,
    "stages": [
      {
        "name": "Mix",
        "seconds": 600
      },
      {
        "name": "Rest",
        "seconds": 1800
      },
      {
        "name": "Proof",
        "seconds": 3600
      },
      {
        "name": "Bake",
        "seconds": 1200
      }
    ],
    "description": "Track independent bakery batches through mixing, resting, proofing and baking.",
    "use": "Name each batch and edit its stages using your recipe before starting.",
    "tip": "Durations are placeholders. Check the dough and recipe rather than relying on time alone.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "laboratory-timer",
    "title": "Laboratory Sample Timer",
    "short": "Laboratory Sample",
    "kind": "specialty",
    "category": "Professional",
    "mode": "sequence",
    "count": 6,
    "stages": [
      {
        "name": "Incubate",
        "seconds": 600
      },
      {
        "name": "Process",
        "seconds": 120
      }
    ],
    "description": "Run independent sample countdowns with named processing stages.",
    "use": "Label every sample, enter your protocol timings and start as each sample is prepared.",
    "tip": "This is a manual aid without validated protocols, audit trails or instrument connections.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "workshop-job-timer",
    "title": "Workshop Job Timer",
    "short": "Workshop Job",
    "kind": "specialty",
    "category": "Professional",
    "mode": "up",
    "count": 6,
    "stages": [
      {
        "name": "Active work",
        "seconds": 0
      }
    ],
    "description": "Measure active work separately for several jobs or clients.",
    "use": "Name each job and pause during breaks. Use Lap to mark a task boundary.",
    "tip": "Export elapsed times for your records. Billing and invoices are not calculated.",
    "detail": "Independent starts · laps · export"
  },
  {
    "slug": "escape-room-timer",
    "title": "Escape Room Timer",
    "short": "Escape Room",
    "kind": "specialty",
    "category": "Professional",
    "mode": "sequence",
    "count": 3,
    "stages": [
      {
        "name": "Game",
        "seconds": 3600
      }
    ],
    "description": "Run independent room countdowns and adjust time during a game.",
    "use": "Name the rooms and set game length. Use +1 minute or −1 minute for adjustments.",
    "tip": "Puzzles, room hardware and remote audience displays are not connected.",
    "detail": "Independent stages · editable timings"
  },
  {
    "slug": "skydiving-ground-timer",
    "title": "Skydiving Ground Preparation Timer",
    "short": "Skydiving Ground Preparation",
    "kind": "specialty",
    "category": "Sports",
    "mode": "sequence",
    "count": 3,
    "stages": [
      {
        "name": "Briefing",
        "seconds": 600
      },
      {
        "name": "Ground preparation",
        "seconds": 900
      },
      {
        "name": "Group ready",
        "seconds": 300
      }
    ],
    "description": "Coordinate briefing and ground preparation for several skydiving groups.",
    "use": "Name each group and set your ground schedule with the organizer.",
    "tip": "For ground scheduling only. Never use this as a freefall, altitude or parachute deployment instrument.",
    "detail": "Independent stages · editable timings"
  }
];
