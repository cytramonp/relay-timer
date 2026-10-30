import { test } from "node:test";
import assert from "node:assert/strict";
import { angleDelta, dialValue } from "../src/core/dial.ts";

test("dial unwraps both directions across twelve o'clock without a jump", () => {
  const d = Math.PI / 180;
  assert.ok(Math.abs(angleDelta(-179 * d, 179 * d) - 2 * d) < 1e-10);
  assert.ok(Math.abs(angleDelta(179 * d, -179 * d) + 2 * d) < 1e-10);
});
test("dial preserves continuous revolutions, snaps detents and clamps limits", () => {
  let minutes = 5;
  for (let turn = 0; turn < 2; turn++) {
    for (let i = 0; i < 60; i++)
      minutes +=
        (angleDelta(((i + 1) * Math.PI) / 30, (i * Math.PI) / 30) /
          (2 * Math.PI)) *
        60;
  }
  assert.equal(dialValue(minutes, 1, 0, 200), 125);
  assert.equal(dialValue(-20, 5, 0, 300), 0);
  assert.equal(dialValue(501, 5, 0, 300), 300);
  assert.equal(dialValue(23, 5, 0, 300), 25);
});
