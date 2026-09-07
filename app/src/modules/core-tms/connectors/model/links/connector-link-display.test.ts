import assert from "node:assert/strict";
import test from "node:test";
import { connectorLinkDisplay } from "./connector-link-display";

test("remote status names take precedence without changing mapping IDs", () => {
  const link = { url: "https://linear.app/team/issue/FQA-1", remoteStatus: "de1fdb6d-5027-4728-8f7b-422d7c4bfc37",
    metadata: { remoteStatusName: "Done" } };
  assert.deepEqual(connectorLinkDisplay(link), { provider: "Linear", status: "Done" });
  assert.equal(link.remoteStatus, "de1fdb6d-5027-4728-8f7b-422d7c4bfc37");
});

test("legacy links omit machine status IDs and retain readable states", () => {
  for (const remoteStatus of ["de1fdb6d-5027-4728-8f7b-422d7c4bfc37", "10003", "5abbe4b7ddc1b351ef961414", " "]) {
    assert.equal(connectorLinkDisplay({ url: "https://trello.com/c/card", remoteStatus, metadata: {} }).status, null);
  }
  assert.equal(connectorLinkDisplay({ url: "https://github.com/team/repo", remoteStatus: "merged", metadata: {} }).status, "merged");
});

test("service labels match actual URL domains instead of misleading substrings", () => {
  for (const [url, provider] of [
    ["https://workspace.slack.com/archives/channel", "Slack"],
    ["https://team.atlassian.net/wiki/spaces/QA", "Confluence"],
    ["https://team.atlassian.net/browse/QA-1", "Jira"],
    ["https://linear.app.example.test/issue/FQA-1", "linear.app.example.test"],
  ]) assert.equal(connectorLinkDisplay({ url, remoteStatus: "", metadata: {} }).provider, provider);
});
