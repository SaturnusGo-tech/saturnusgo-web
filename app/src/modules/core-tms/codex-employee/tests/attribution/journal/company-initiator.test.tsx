import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { AdministrationEvent } from "../../../../company-administration/domain/administration";
(globalThis as typeof globalThis & {
    React: typeof React;
}).React = React;
require.extensions[".css"] = module => { module.exports = {}; };
const { ActivityFeed } = require("../../../../company-administration/presentation/activity-feed/ActivityFeed") as typeof import("../../../../company-administration/presentation/activity-feed/ActivityFeed");
const event: AdministrationEvent = { id: "event", action: "run_item.status_changed", actorName: "Codex", targetName: "QA-1", occurredAt: "2026-11-01T00:00:00Z", requestId: "request", status: "failed" };
test("company journal renders only verified human initiator independently of Codex actor", () => {
    const html = renderToStaticMarkup(<ActivityFeed events={[{ ...event, initiatedBy: { identityId: "human", name: "Ada" } }]} locale="en"/>);
    assert.match(html, /Codex/);
    assert.match(html, /Initiated by/);
    assert.match(html, /Ada/);
    const ordinary = renderToStaticMarkup(<ActivityFeed events={[{ ...event, actorName: "Codex" }]} locale="en"/>);
    assert.doesNotMatch(ordinary, /Initiated by|Ada/);
});
