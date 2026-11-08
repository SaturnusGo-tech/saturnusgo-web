import assert from "node:assert/strict";
import test from "node:test";
import { caseMarkdownImages } from "../caseMarkdownImages";

test("only safe Markdown images become deduplicated attachment links", () => {
  const markdown = [
    "![Diagram](https://assets.example/diagram.png)",
    "![Same](https://assets.example/diagram.png)",
    "![Invalid](javascript:alert%281%29)",
    "![Tracked](https://account:password@assets.example/private.png)",
    "![Data](data:image/png;base64,AAAA)",
    "![Relative](/api/v1/other)",
    "[Normal link](https://assets.example/page)",
    "`![Code](https://assets.example/hidden)`",
    "![Map][workspace-map]",
    "",
    "[workspace-map]: https://assets.example/map.webp",
  ].join("\n");
  assert.deepEqual(caseMarkdownImages([markdown]), [
    { url: "https://assets.example/diagram.png", label: "Diagram" },
    { url: "https://assets.example/map.webp", label: "Map" },
  ]);
});
