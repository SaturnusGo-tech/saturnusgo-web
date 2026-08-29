import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("Recharts scales render when Function.prototype is frozen", () => {
  const script = String.raw`
    const assert = require("node:assert/strict");
    const {
      rechartsScaleFactory,
    } = require("./node_modules/recharts/lib/util/scale/RechartsScale.js");

    function scale(value) {
      return value * 10;
    }
    scale.domain = () => [0, 10];
    scale.range = () => [100, 0];
    scale.ticks = () => [0, 5, 10];

    Object.freeze(Function.prototype);

    const adapted = rechartsScaleFactory(scale);
    assert.deepEqual(adapted.domain(), [0, 10]);
    assert.deepEqual(adapted.range(), [0, 100]);
    assert.equal(adapted.rangeMin(), 0);
    assert.equal(adapted.rangeMax(), 100);
    assert.equal(adapted.map(4), 40);
    assert.deepEqual(adapted.ticks(3), [0, 5, 10]);
  `;

  const output = execFileSync(process.execPath, ["-e", script], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(output, "");
});
