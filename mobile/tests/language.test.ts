import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  matchesTimerSearch,
  readLanguage,
  translator,
} from "../src/core/language.ts";
import { decodeStore, emptyStore } from "../src/core/store-codec.ts";
import { eggMilestones } from "../src/core/egg.ts";
import { freshBoard, type BoardProfile } from "../src/core/board.ts";
import { act, settle } from "../src/core/board-engine.js";

function messages(locale: string) {
  return JSON.parse(
    readFileSync(
      new URL(`../src/locales/${locale}.json`, import.meta.url),
      "utf8",
    ),
  ) as Record<string, string>;
}

test("language survives serialization and older or unknown settings use English", () => {
  const original = emptyStore();
  original.settings.language = "fr";
  original.drafts.meeting.title = "My original name";
  const restored = decodeStore(JSON.stringify(original)).store;
  assert.equal(restored.settings.language, "fr");
  assert.equal(restored.drafts.meeting.title, "My original name");
  assert.equal(readLanguage("it"), "en");
  assert.equal(readLanguage(undefined), "en");
});

test("translated and English catalog text support accent-free multiword searches", () => {
  const tr = translator(messages("fr"));
  assert.ok(matchesTimerSearch("meditation minuteur", tr("Meditation Timer")));
  assert.ok(matchesTimerSearch("MINUTEUR meditation", tr("Meditation Timer")));
  assert.ok(
    matchesTimerSearch(
      "meditation timer",
      tr("Meditation Timer"),
      "Meditation Timer",
    ),
  );
  assert.ok(matchesTimerSearch("gross oeuf", "groß œuf"));
  assert.ok(!matchesTimerSearch("meditation boxing", tr("Meditation Timer")));
});

test("localized templates preserve user text and all placeholder positions", () => {
  const name = "Meeting {0}";
  assert.equal(
    translator({ "Open {0}": "Abrir {0}" })("Open {0}", name),
    "Abrir " + name,
  );
  const keys = Object.keys(messages("es")).sort();
  for (const locale of ["es", "fr", "de", "pt"]) {
    const localeMessages = messages(locale);
    assert.deepEqual(Object.keys(localeMessages).sort(), keys, locale);
    for (const key of keys) {
      const values = localeMessages[key];
      assert.ok(values.trim(), locale + ": " + key);
      assert.deepEqual(
        [...values.matchAll(/\{\d+\}/g)].map(([id]) => id).sort(),
        [...key.matchAll(/\{\d+\}/g)].map(([id]) => id).sort(),
        locale + ": " + key,
      );
    }
  }
});

test("egg pictures track the real clock, respect edited times, and reset", () => {
  const profiles = JSON.parse(
    readFileSync(
      new URL("../src/core/specialty-catalog.json", import.meta.url),
      "utf8",
    ),
  ) as BoardProfile[];
  const profile = profiles.find((item) => item.slug === "egg-timer")!;
  const names = profile.stages.map((stage) => stage.name);
  const [initial] = freshBoard(profile);
  const [started] = act([initial], 0, "toggle", profile.mode, 1000);
  assert.deepEqual(eggMilestones(started, names), {
    selected: 0,
    seconds: [0, 300, 360, 420, 480, 600],
  });
  assert.equal(
    eggMilestones(settle(started, profile.mode, 301000), names)?.selected,
    1,
  );
  const done = settle(started, profile.mode, 601000);
  assert.equal(eggMilestones(done, names)?.selected, 5);
  assert.equal(
    eggMilestones(act([done], 0, "reset", profile.mode, 601000)[0], names)?.selected,
    0,
  );
  const edited = {
    ...initial,
    stages: initial.stages.map((s, i) =>
      i === 0 ? { ...s, seconds: 240 } : s,
    ),
  };
  assert.equal(eggMilestones(edited, names)?.seconds[1], 240);
  assert.equal(
    eggMilestones({ ...initial, stages: initial.stages.slice(1) }, names),
    null,
  );
});
