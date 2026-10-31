// Read-only audit harness. No network, native APIs, credentials or user data.
// Run from any directory with Node >= 24: node mobile/audits/2026-10-30/reproduce.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { act, settle, elapsed, display } from '../../src/core/board-engine.js';
import { freshBoard, customProfile, servingBoard, boardCsv } from '../../src/core/board.ts';
import { validateConfig, writeBackup, readBackup } from '../../src/core/backup.ts';

const results = {};
const scheduled = servingBoard(freshBoard(customProfile), 900000, 0);
const reset = act(scheduled, 0, 'reset', 'sequence', 1000);
assert.equal(reset[0].scheduledAt, 540000);
// This is the exact scheduled-start transition used by the screen's interval.
const scheduledTick = (c, time) => settle(
  c.scheduledAt && c.scheduledAt <= time
    ? { ...c, anchor: c.scheduledAt, scheduledAt: null } : c,
  'sequence', time,
);
const autoStartedAfterReset = scheduledTick(reset[0], 540200);
assert.equal(autoStartedAfterReset.anchor, 540000);
const manuallyStarted = act(reset, 0, 'toggle', 'sequence', 10000);
const restartedAtOldSchedule = scheduledTick(manuallyStarted[0], 540200);
assert.equal(restartedAtOldSchedule.index, 0);
assert.equal(restartedAtOldSchedule.done, false);
results.scheduledReset = {
  scheduledAt: reset[0].scheduledAt,
  resetCardAutostarts: autoStartedAfterReset.anchor !== null,
  manuallyStartedAt: 10000,
  unexpectedAnchorAfterOldSchedule: restartedAtOldSchedule.anchor,
};

let laps = freshBoard({ ...customProfile, mode: 'up', stages: [{ name: 'Lap', seconds: 0 }] });
laps = act(laps, 0, 'toggle', 'up', 1000);
for (let n = 1; n <= 501; n++) {
  laps = act(laps, 0, 'lap', 'up', 1000 + n * 1000)
    .map(c => ({ ...c, laps: c.laps.slice(-500) }));
}
const firstLapRow = boardCsv(laps, 502000).split('\r\n').find(s => s.includes('"Lap record"'));
assert(firstLapRow.includes('"2.00","Recorded","1","2.00"'));
results.lapCap = { recorded: 501, kept: laps[0].laps.length, firstLapRow,
  expectedFirstRetainedLapNumber: 2, expectedSplitSeconds: 1 };

const config = validateConfig('meeting', {
  agenda: Array.from({ length: 200 }, (_, i) => ({
    id: `slot-${i}`, name: 'A'.repeat(120), seconds: 60, kind: 'person',
  })),
});
const programs = Array.from({ length: 200 }, (_, i) => ({
  id: `program-${i}`, kind: 'meeting', name: `Meeting ${i}`, config, updatedAt: 0,
}));
const json = writeBackup(programs);
let importError;
try { readBackup(json, () => 'id'); } catch (e) { importError = e.message; }
assert(importError?.includes('4 MB'));
results.backupRoundTrip = { validPrograms: programs.length, agendaItemsPerProgram: 200,
  exportedCharacters: json.length, exportedBytes: Buffer.byteLength(json), importError };

const stopwatch = act(freshBoard({ ...customProfile, mode: 'up',
  stages: [{ name: 'Lap', seconds: 0 }] }), 0, 'toggle', 'up', 1000000)[0];
results.wallClockChange = {
  beforeCorrection: display(stopwatch, 'up', 1010000),
  afterWallClockAdvancedOneHour: display(stopwatch, 'up', 4610000),
  expectedIfTenSecondsReallyPassed: '0:10',
};
assert.equal(elapsed(stopwatch, 4610000), 3610000);

// Execute the actual start/action/resetAll functions extracted from the route.
// This isolates client session logic with storage/network mocks; it is NOT a device E2E.
const routeUrl = new URL('../../src/app/specialty/[slug].tsx', import.meta.url);
const route = fs.readFileSync(routeUrl, 'utf8');
const controller = route.slice(route.indexOf('  async function start('), route.indexOf('  function patch('));
assert(controller.includes('async function resetAll()'));
const require = createRequire(new URL('../../package.json', import.meta.url));
const ts = require('typescript');
const js = ts.transpileModule(controller, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
let reserved = 0, nonce = 0;
const persisted = new Map();
const AsyncStorage = {
  getItem: async k => persisted.get(k) ?? null,
  setItem: async (k, v) => { persisted.set(k, v); },
  removeItem: async k => { persisted.delete(k); },
};
const runController = new Function('AsyncStorage', 'reserveSession', 'Crypto', 'act', 'freshBoard', `
  const ready=true, busy={current:false}, session={current:null}, persist={current:true};
  const p={...${JSON.stringify(customProfile)},mode:'sequence'},key='audit.board';
  let board=freshBoard(p);
  const Keyboard={dismiss(){}}, setPending=()=>{}, setNote=()=>{}, cue=()=>{}, setEdit=()=>{};
  const customize=fn=>fn(),setBoard=v=>{board=typeof v==='function'?v(board):v;};
  ${js}
  return { start:()=>start((b,time)=>act(b,0,'toggle',p.mode,time)),
    resetCard:()=>action(0,'reset'), resetAll, session };
`)(AsyncStorage, async () => { reserved++; }, { randomUUID: () => `audit-${++nonce}` }, act, freshBoard);
await runController.start();
runController.resetCard();
await runController.start();
runController.resetCard();
await runController.start();
assert.equal(reserved, 1);
const reusedSession = runController.session.current;
await runController.resetAll();
await runController.start();
assert.equal(reserved, 2);
results.specialtyQuota = { startsIncludingTwoIndividualResets: 3,
  reservationsBeforeFullBoardReset: 1, reusedSession,
  reservationsAfterFullBoardResetAndStart: reserved,
  caveat: 'Local extracted controller with mocks; intended boundary of a billable session still needs a product rule.' };

// Verify code inspection assumptions have not silently drifted.
const appStore = fs.readFileSync(new URL('../../src/state/app-store.tsx', import.meta.url), 'utf8');
const resetBody = appStore.slice(appStore.indexOf('    resetDevice() {'), appStore.indexOf('\n  };', appStore.indexOf('    resetDevice() {')));
assert(resetBody.includes('commit(emptyStore())'));
assert(!resetBody.includes('AsyncStorage'));
results.resetScope = { sqliteOnly: true, evidence: 'resetDevice calls emptyStore/commit, without clearing AsyncStorage board/feedback/favorite/host keys',
  method: 'Source assertion, not a native reset test' };

// Exercise the real notification queue using an intentionally delayed native mock.
const notificationSource = fs.readFileSync(new URL('../../src/services/notifications.ts', import.meta.url), 'utf8');
const notificationBody = notificationSource.slice(notificationSource.indexOf('let queue = Promise.resolve();'));
const notificationJs = ts.transpileModule(notificationBody.replace('export function', 'function'),
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
let releaseRead;
const delayedRead = new Promise(resolve => { releaseRead = resolve; });
const scheduledIds = [];
let reads = 0;
const notificationMock = {
  getAllScheduledNotificationsAsync: async () => { if (++reads === 1) await delayedRead; return []; },
  cancelScheduledNotificationAsync: async () => {},
  getPermissionsAsync: async () => ({ granted: true }),
  scheduleNotificationAsync: async value => { scheduledIds.push(value.identifier); },
  SchedulableTriggerInputTypes: { DATE: 'date' },
};
const sync = new Function('Notifications', 'Platform', 'alarmPlan', `${notificationJs};return syncNotifications;`)(
  notificationMock, { OS: 'android' }, () => [{ at: Date.now() + 60000, title: 'audit', body: '' }]);
const fakeRun = id => ({ id, kind: 'simple', config: { sound: 'bell', volume: 100 } });
const queued = [sync(fakeRun('old'), true), sync(fakeRun('new'), true), sync(null, false)];
releaseRead();
await Promise.all(queued);
assert.deepEqual(scheduledIds, ['corptimer-old-0', 'corptimer-new-0']);
results.notificationQueue = { lastRequestedState: 'paused/disabled',
  obsoleteRunsStillScheduledBeforeFinalCancellation: scheduledIds,
  method: 'Actual queue with delayed mock; no claim about real OS delivery latency' };

// Exercise the exact remote command callback while a start is still pending.
const liveSource = fs.readFileSync(new URL('../../src/state/live-store.tsx', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const callback = liveSource.slice(liveSource.indexOf('        (id, action, at) => {'),
  liveSource.indexOf('\n        () =>\n          setError(', liveSource.indexOf('        (id, action, at) => {'))).trim().replace(/,$/, '');
const callbackJs = ts.transpileModule(`const callback = ${callback};`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
let resolveStart;
const pendingStart = new Promise(resolve => { resolveStart = resolve; });
const cleared = [], publishedAcks = [];
const lastCommand = { current: null };
const handler = new Function('handled', 'current', 'lastCommand', 'publish', 'service', 'host',
  `${callbackJs};return callback;`)({ current: new Set() }, { current: {
    snapshot: () => ({ run: null }), start: () => pendingStart,
  } }, lastCommand, async () => { publishedAcks.push(lastCommand.current); },
  { clearCommand: async (_, id) => { cleared.push(id); } }, { id: 'audit-room' });
handler('audit-command', 'next', Date.now());
assert.deepEqual(cleared, ['audit-command']);
assert.deepEqual(publishedAcks, ['audit-command']);
resolveStart(false);
await pendingStart;
results.liveCommandAcknowledgement = { startEventuallySucceeded: false,
  acknowledgedBeforeStartResolved: publishedAcks, deletedBeforeStartResolved: cleared,
  method: 'Actual callback with pending mocked start resolving false; no live Firestore writes' };

console.log(JSON.stringify({ baseline: '96a0579581279fc8ab27e394b9fab93eae989f02',
  runtimeBaseline: '6b7b5652fb74f947126af70e8f167074b22897f5',
  node: process.version, harness: fileURLToPath(import.meta.url).replaceAll('\\', '/').split('/mobile/')[1],
  results }, null, 2));
