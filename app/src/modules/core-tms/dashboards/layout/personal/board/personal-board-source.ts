import { TmsApiError, type TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { LayoutError, type BoardScope, type LayoutSource } from "../../model/layout";
import { personalViewSource, type PersonalResource, type PersonalView } from "../../preferences/data/personal-view-source";

type View = Extract<PersonalView, { kind: "board" }>;

function mapBoard(scope: BoardScope, { data, etag }: PersonalResource<View>) {
  if (!data.board) return null;
  const widgets = [...data.board.widgets].sort((left, right) =>
    left.position.y - right.position.y || left.position.x - right.position.x);
  return { ...scope, id: "personal-dashboard", name: data.board.name, widgets, etag };
}

function failure(error: unknown): never {
  if (error instanceof LayoutError) throw error;
  if (error instanceof TmsApiError) {
    if (error.status === 412) throw new LayoutError("conflict");
    if (error.status === 401 || error.status === 403) throw new LayoutError("permission");
    if (error.status === 400 || error.status === 409) throw new LayoutError("invalid");
  }
  throw new LayoutError("unavailable");
}

export function createPersonalDashboardBoardSource(http: TmsHttpClient): LayoutSource {
  return {
    async load(scope, signal) {
      try {
        const resource = await personalViewSource(http, scope, "board").load(signal);
        return mapBoard(scope, resource);
      } catch (error) { signal.throwIfAborted(); return failure(error); }
    },
    async save(scope, current, draft, key) {
      try {
        const resource = await personalViewSource(http, scope, "board").save({
          kind: "board", name: draft.name.trim(), widgets: draft.widgets,
        }, current?.etag ?? '"dashboard-personal-view:0"', key);
        const board = mapBoard(scope, resource);
        if (!board) throw new LayoutError("invalid");
        return board;
      } catch (error) { return failure(error); }
    },
  };
}
