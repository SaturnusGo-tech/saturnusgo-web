import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("Recharts scales render with frozen runtime intrinsics", () => {
  const script = String.raw`
    const assert = require("node:assert/strict");
    const {
      rechartsScaleFactory,
    } = require("./node_modules/recharts/lib/util/scale/RechartsScale.js");
    const Decimal = require("./node_modules/decimal.js/decimal.js");

    function scale(value) {
      return value * 10;
    }
    scale.domain = () => [0, 10];
    scale.range = () => [100, 0];
    scale.ticks = () => [0, 5, 10];

    Object.freeze(Function.prototype);
    Object.freeze(Object.prototype);

    const decimal = new Decimal("0.1").plus("0.2");
    assert.equal(decimal.toString(), "0.3");

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
