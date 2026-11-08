import assert from "node:assert/strict";
import { test } from "node:test";

import { createTmsHttpClient, TmsApiError } from "../../../../../../core/tms/transport/http";
import { DashboardLayoutController } from "../../application/DashboardLayoutController";
import { createPersonalDashboardBoardSource } from "../../personal/board/personal-board-source";
import { applyPersonalLayout } from "../../personal/personal-layout-source";
import { defaultPreferences } from "../../preferences/preferences";
import type { PersonalView, PersonalViewSource } from "../../preferences/data/personal-view-source";
import { DashboardPreferenceSync } from "../../preferences/sync/dashboard-preference-sync";
import type { BoardDraft, BoardWidget, ProjectBoard } from "../../model/layout";

type View = Extract<PersonalView, { kind: "preferences" }>;
const version = (rowVersion: number, preferences = defaultPreferences) => ({
  etag: `"dashboard-personal-view:${rowVersion}"`,
  data: { kind: "preferences" as const, rowVersion, updatedAt: null, preferences },
});
const conflict = () => new TmsApiError("Version changed", 412, null);
const idle = () => new Promise<void>(resolve => setImmediate(resolve));

void test("a local import that loses to Codex cannot overwrite newer settings", async () => {
  let remote = version(0);
  const source: PersonalViewSource<View> = {
    load: async () => remote,
    save: async (_patch, etag) => {
      assert.equal(etag, version(0).etag);
      remote = version(1, { ...defaultPreferences, section: "runs" });
      throw conflict();
    },
  };
  const sync = new DashboardPreferenceSync(source, () => "import-key");
  sync.start({ ...defaultPreferences, section: "defects" });
  await idle();
  assert.equal(sync.getSnapshot().value.section, "runs");
  assert.equal(sync.getSnapshot().stored, true);
  sync.stop();
});

void test("web changes rebase only the changed fields and retry the same command after response loss", async () => {
  let remote = version(2, { ...defaultPreferences, section: "defects" });
  let committed = false;
  let attempts = 0;
  const replayKeys: string[] = [];
  const source: PersonalViewSource<View> = {
    load: async () => remote,
    save: async (change, etag, key) => {
      assert.equal(change.kind, "preferences");
      assert.deepEqual(change.patch, { period: "7d" });
      attempts += 1;
      if (attempts === 1) {
        assert.equal(etag, version(2).etag);
        remote = version(3, { ...remote.data.preferences, section: "runs" });
        throw conflict();
      }
      replayKeys.push(key);
      assert.equal(etag, version(3).etag);
      if (committed) return version(4, { ...remote.data.preferences, section: "runs" });
      committed = true;
      remote = version(5, { ...remote.data.preferences, period: "7d", section: "library" });
      throw new Error("Lost response");
    },
  };
  let command = 0;
  const sync = new DashboardPreferenceSync(source, () => String(++command));
  sync.start({ ...defaultPreferences, section: "overview" });
  await idle();
  assert.equal(sync.getSnapshot().value.section, "defects");
  sync.update({ period: "7d" });
  await idle();
  assert.equal(sync.getSnapshot().stored, false);
  await sync.refresh();
  assert.deepEqual(replayKeys, ["2", "2"]);
  assert.equal(sync.getSnapshot().stored, true);
  assert.deepEqual(sync.getSnapshot().value, remote.data.preferences);
  sync.stop();
});

void test("private widget positions reorder and resize the display while preserving the team layout", () => {
  const board: ProjectBoard = {
    id: "board", projectId: "project", workspaceId: "workspace", etag: '"dashboard:board:8"', name: "Team",
    widgets: [{ id: "a", type: "summary", title: "Summary", position: { x: 0, y: 0, width: 3, height: 1 }, settings: {} },
      { id: "b", type: "summary", title: "Other", position: { x: 0, y: 1, width: 3, height: 1 }, settings: {} }],
  };
  const view = applyPersonalLayout(board, { etag: '"dashboard-personal-view:3"', data: {
    kind: "layout", rowVersion: 3, updatedAt: null, dashboardId: board.id, dashboardRowVersion: 8,
    positions: [{ widgetId: "a", position: { x: 0, y: 2, width: 6, height: 1 } },
      { widgetId: "removed", position: { x: 0, y: 0, width: 12, height: 1 } }],
  } });
  assert.deepEqual(view.widgets.map(widget => [widget.id, widget.position.width]), [["b", 3], ["a", 6]]);
  assert.deepEqual(board.widgets.map(widget => [widget.id, widget.position.width]), [["a", 3], ["b", 3]]);
});

void test("a tester's personal draft never writes the shared dashboard endpoint", async () => {
  const scope = { workspaceId: "workspace", projectId: "project" };
  const widget: BoardWidget = { id: "personal-widget", type: "summary", title: "Coverage",
    position: { x: 0, y: 0, width: 3, height: 1 }, settings: {} };
  const teamBoard: BoardDraft = { name: "Team", widgets: [{ ...widget, id: "team-widget" }] };
  let saved: BoardDraft | null = null;
  let rowVersion = 0;
  const http = createTmsHttpClient({ apiBase: "https://tms.example/api/v1", credentials: "include",
    fetch: async (url, init) => {
      assert.equal(String(url), "https://tms.example/api/v1/projects/project/dashboard-personal-view?workspaceId=workspace&board=true");
      if (init?.method === "PATCH") {
        const headers = new Headers(init.headers);
        assert.equal(headers.get("if-match"), `"dashboard-personal-view:${rowVersion}"`);
        assert.equal(headers.get("idempotency-key"), "private-board-command");
        const { change: { kind, name, widgets } } = JSON.parse(String(init.body));
        assert.equal(kind, "board");
        saved = { name, widgets };
        rowVersion++;
      }
      return new Response(JSON.stringify({ data: { kind: "board", rowVersion, updatedAt: null, board: saved } }), {
        headers: { etag: `"dashboard-personal-view:${rowVersion}"` },
      });
    },
  });
  const controller = new DashboardLayoutController(createPersonalDashboardBoardSource(http), scope, () => "private-board-command");
  await controller.load();
  assert.equal(controller.getState().board, null);
  controller.edit("My dashboard", teamBoard);
  controller.remove("team-widget");
  controller.add([widget]);
  controller.rename("My release checks");
  await controller.save();
  assert.deepEqual(saved, { name: "My release checks", widgets: [widget] });
  assert.deepEqual(teamBoard.widgets.map(({ id }) => id), ["team-widget"]);
  await controller.load();
  assert.equal(controller.getState().board?.name, "My release checks");
  assert.equal(controller.getState().board?.etag, '"dashboard-personal-view:1"');
});
