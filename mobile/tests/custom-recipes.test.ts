import test from "node:test";
import assert from "node:assert/strict";
import { customRecipes, recipeSetup } from "../src/core/custom-recipes.ts";
import {
  restoreBoard,
  boardOptions,
  customProfile,
} from "../src/core/board.ts";
import { act, settle } from "../src/core/board-engine.js";
import { validMedia } from "../src/core/custom-media.ts";

test("ten recipes survive export/import and complete at their total duration", () => {
  assert.equal(customRecipes.length, 10);
  assert.equal(new Set(customRecipes.map((r) => r.id)).size, 10);
  for (const recipe of customRecipes) {
    const serialized = JSON.stringify(recipeSetup(recipe.id));
    const saved = JSON.parse(serialized);
    const board = restoreBoard(saved.board, "sequence", 1000);
    assert.equal(board[0].name, recipe.title);
    assert.equal(board[0].anchor, null);
    const running = act(board, 0, "toggle", "sequence", 1000)[0];
    const total = recipe.stages.reduce((sum, s) => sum + s.seconds * 1000, 0);
    assert.equal(
      settle(running, "sequence", 1000 + total - 1).done,
      false,
      recipe.id,
    );
    assert.equal(
      settle(running, "sequence", 1000 + total).done,
      true,
      recipe.id,
    );
  }
});
test("recipe copies cannot mutate the gallery", () => {
  const first = recipeSetup("boxing");
  first.board[0].stages[0].seconds = 2;
  assert.equal(recipeSetup("boxing").board[0].stages[0].seconds, 60);
});
test("imported cue names cannot select an unsupported audio source", () => {
  const setup = recipeSetup("egg");
  setup.board[0].stages[0].cueEnd = "https://example.com/audio.mp3";
  setup.board[0].stages[0].cueStart = "unknown";
  const restored = restoreBoard(setup.board, "sequence", 0);
  assert.equal(restored[0].stages[0].cueEnd, "bell");
  assert.equal(restored[0].stages[0].cueStart, "off");
});
test("brand options accept portable assets and reject remote or oversized media", () => {
  const audio = { name: "bell.wav", uri: "data:audio/wav;base64,UklGRg==" };
  assert.equal(validMedia(audio, "audio"), true);
  assert.equal(
    validMedia(
      { name: "remote", uri: "https://example.com/track.mp3" },
      "audio",
    ),
    false,
  );
  assert.equal(
    validMedia(
      { ...audio, uri: "data:audio/wav;base64," + "A".repeat(2_800_001) },
      "audio",
    ),
    false,
  );
  assert.equal(
    validMedia({ name: "svg", uri: "data:image/svg+xml;base64,AAAA" }, "image"),
    false,
  );
  const clean = boardOptions(
    {
      accent: "bad",
      customSound: audio,
      logo: { name: "remote", uri: "file:///x" },
    },
    customProfile,
  );
  assert.equal(clean.accent, undefined);
  assert.equal(clean.logo, undefined);
  assert.deepEqual(clean.customSound, audio);
});
