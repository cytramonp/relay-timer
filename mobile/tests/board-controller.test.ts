import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { act } from "../src/core/board-engine.js";
import { freshBoard, customProfile } from "../src/core/board.ts";
import { boardSessionContinues } from "../src/core/session.ts";

// Execute the actual route controller with storage/auth doubles, without a
// parallel implementation of the quota algorithm or an external API call.
const source = fs.readFileSync(
  new URL("../src/app/specialty/[slug].tsx", import.meta.url),
  "utf8",
);
const ast = ts.createSourceFile(
  "board.tsx",
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const wanted = new Set(["start", "action", "resetAll"]);
const functions: string[] = [];
function visit(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) && node.name && wanted.has(node.name.text))
    functions.push(node.getText(ast));
  ts.forEachChild(node, visit);
}
visit(ast);
assert.equal(functions.length, 3);
const js = ts.transpileModule(functions.join("\n"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
function controller() {
  let uid = "account-A",
    enabled = true,
    next = 0,
    reject = false;
  const charged = new Set<string>();
  const data = new Map<string, string>();
  const errors: string[] = [];
  const storage = {
    getItem: async (k: string) => data.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: async (k: string) => {
      data.delete(k);
    },
    current: () => enabled,
  };
  const build = new Function(
    "AsyncStorage",
    "sessionIdentity",
    "reserveSession",
    "Crypto",
    "act",
    "freshBoard",
    "boardSessionContinues",
    "customProfile",
    "onError",
    `
    const ready=true,busy={current:false},session={current:null},sessionOwner={current:null},persist={current:true};
    const p=customProfile,key='corptimer.board.audit', Keyboard={dismiss(){}},timerNow=()=>1000;
    let board=freshBoard(p); const current={current:board};
    const setBoard=fn=>{board=typeof fn==='function'?fn(board):fn;current.current=board;};
    const setPending=()=>{},setNote=onError,setEdit=()=>{},cue=()=>{},customize=fn=>fn();
    ${js}
    return {start:()=>start((b,time)=>act(b,0,'toggle',p.mode,time)),action,resetAll,
      board:()=>board,session,sessionOwner};
  `,
  );
  const c = build(
    storage,
    async () => uid,
    async (id: string, expectedUid: string) => {
      assert.equal(expectedUid, uid);
      if (reject) throw Error("offline");
      charged.add(`${uid}:${id}`);
    },
    { randomUUID: () => `reservation-${++next}` },
    act,
    freshBoard,
    boardSessionContinues,
    customProfile,
    (text: string) => errors.push(text),
  );
  return {
    c,
    charged,
    data,
    errors,
    account: (value: string) => {
      uid = value;
    },
    offline: (value: boolean) => {
      reject = value;
    },
    close: () => {
      enabled = false;
    },
  };
}
test("real specialty start/pause/resume shares one grant; reset and account change need new grants", async () => {
  const { c, charged, account } = controller();
  await c.start();
  c.action(0, "toggle"); // Pause
  await c.start();
  assert.equal(charged.size, 1);
  c.action(0, "reset");
  await c.start();
  assert.equal(charged.size, 2);
  c.action(0, "toggle");
  account("account-B");
  await c.start();
  assert.equal(charged.size, 3);
  assert.equal(c.sessionOwner.current, "account-B");
});
test("failed reservation is retried with its saved ID and never starts a clock offline", async () => {
  const { c, charged, offline, data } = controller();
  offline(true);
  await c.start();
  assert.equal(c.board()[0].anchor, null);
  assert.equal(data.get("corptimer.board.audit.reservation"), "reservation-1");
  offline(false);
  await c.start();
  assert.equal(c.session.current, "reservation-1");
  assert.equal(charged.size, 1);
});
