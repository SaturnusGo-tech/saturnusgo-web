import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { LayoutError, type LayoutSource, type ProjectBoard } from "../model/layout";
import { personalViewSource, type PersonalView, type PersonalResource } from "../preferences/data/personal-view-source";

type View = Extract<PersonalView, { kind: "layout" }>;

export function applyPersonalLayout(board: ProjectBoard, { data, etag }: PersonalResource<View>): ProjectBoard {
  const positions = new Map(data.positions.map(({ widgetId, position }) => [widgetId, position]));
  return { ...board, etag, widgets: board.widgets
    .map(widget => ({ ...widget, position: positions.get(widget.id) ?? widget.position }))
    .sort((left, right) => left.position.y - right.position.y || left.position.x - right.position.x) };
}

export function createPersonalDashboardLayoutSource(http: TmsHttpClient, team: ProjectBoard): LayoutSource {
  const source = personalViewSource(http, team, "layout", team.id);
  const teamVersion = Number(team.etag.slice(team.etag.lastIndexOf(":") + 1, -1));
  return {
    async load(_scope, signal) {
      return applyPersonalLayout(team, await source.load(signal));
    },
    async save(_scope, current, draft, key) {
      if (!current || !Number.isSafeInteger(teamVersion) || teamVersion < 1) throw new LayoutError("conflict");
      try {
        const positions = draft.widgets.map(({ id: widgetId, position }) => ({ widgetId, position }));
        const saved = await source.save({ kind: "layout", positions, expectedDashboardRowVersion: teamVersion },
          current.etag, key);
        return applyPersonalLayout(team, saved);
      } catch (error) {
        if (!(error instanceof TmsApiError)) throw error;
        throw new LayoutError(error.status === 412 || error.status === 404 ? "conflict" :
          error.status === 403 || error.status === 401 ? "permission" :
          error.status === 400 || error.status === 409 ? "invalid" : "unavailable");
      }
    },
  };
}
