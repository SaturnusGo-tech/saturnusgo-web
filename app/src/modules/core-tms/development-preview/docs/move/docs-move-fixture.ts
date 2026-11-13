import type { ProductDocDetail, ProductDocNode, ProductDocScope, ProductDocsApi } from "../../../product-docs/domain/product-docs";

export const moveScope: ProductDocScope = { workspaceId: "preview_move", projectId: "preview_host" };
const animatedFolder = "data:image/gif;base64,R0lGODlhGAAYAIEAAFeX9v///7bS/wAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJQQABACwAAAAAGAAYAAAIYwADCBxIsKDBgwgTKlyYEIDDhw8ZCoRI0aHEihQvYtwYkSDHjwA8guQ4cKRDASghlhyJsmXHACxbugw5EaTMmSs/3kxJE2bMmT1NAgAaVGjFnEZfJs1Yc6lFpEYNLpVItWrCgAAh+QQJQQABACwAAAAAGAAYAIFXl/b////3+PgAAAAIYwADCBxIsKDBgwgTKlyYEIDDhw8ZCoRI0aHEihQvYtwYkSDHjwA8guQ4cKRDASghlhyJsmXHACxbugw5EaTMmSs/3kxJE2bMmT1NAgAaVGjFnEZfJs1Yc6lFpEYNLpVItWrCgAA7";

export function createDocsMoveFixture(ru: boolean, log: (message: string) => void = () => undefined) {
  const t = (en: string, russian: string) => ru ? russian : en;
  const node = (id: string, parentId: string | null, kind: ProductDocNode["kind"], title: string,
    appearance?: ProductDocNode["appearance"]): ProductDocDetail => ({ id, parentId, kind, title, appearance,
    draftVersion: 3, lifecycleVersion: 3, publishedVersion: 2, version: null, canEdit: true, canPublish: true, canArchive: true, canDelete: true, sections: [] });
  const docs = [
    node("platform", null, "folder", t("Product architecture", "Архитектура продукта"), { kind: "icon", iconId: "compass", color: "#5797F6" }),
    node("current", "platform", "folder", t("Host calendar and bookings", "Календарь хоста и бронирования"), { kind: "icon", iconId: "calendar", color: "#7D75ED" }),
    node("source", "current", "page", t("Errors, retained state and regression after reconnecting", "Ошибки, сохранение состояния и регрессия после восстановления соединения")),
    node("source-child", "source", "page", t("Source child · excluded from destinations", "Дочерняя страница источника · исключена из назначений")),
    node("calendar-overview", "current", "page", t("Calendar overview and date navigation", "Обзор календаря и навигация по датам")),
    node("calendar-checks", "current", "folder", t("Regression scenarios and release acceptance criteria", "Регрессионные сценарии и критерии приёмки перед выпуском"), { kind: "icon", iconId: "list-checks", color: "#43A58C" }),
    node("calendar-mobile", "calendar-checks", "page", t("Mobile calendar navigation", "Мобильная навигация по календарю")),
    node("access", "platform", "folder", t("Authentication and access", "Авторизация и права доступа"), { kind: "icon", iconId: "shield", color: "#5797F6" }),
    node("sessions", "access", "page", t("Sessions and account switching", "Сессии и переключение учётных записей")),
    node("release", null, "folder", t("Release readiness", "Готовность к выпуску"), { kind: "gif", provider: "klipy", id: "local_fixture", url: animatedFolder }),
    node("release-guide", "release", "page", t("Release guide", "Руководство по выпуску")),
    node("release-signoff", "release-guide", "page", t("Acceptance and sign-off", "Приёмка и подтверждение выпуска")),
    node("qa-guide", null, "page", t("QA handbook: test preparation, execution and evidence", "Руководство QA: подготовка проверок, выполнение и сбор артефактов")),
    node("qa-child", "qa-guide", "page", t("Evidence requirements", "Требования к артефактам")),
    node("payments", null, "folder", t("Payments and refunds", "Платежи и возвраты"), { kind: "icon", iconId: "tag", color: "#DCA64C" }),
    node("payments-contract", "payments", "page", t("Payment contract and idempotency", "Контракт платежей и идемпотентность")),
    node("integrations", null, "folder", t("Integrations and delivery routes", "Интеграции и маршруты доставки"), { kind: "icon", iconId: "puzzle-piece", color: "#C46BD9" }),
    node("draft-parent", null, "page", t("Unpublished planning page", "Неопубликованная страница планирования")),
    node("reports", null, "folder", t("Reports and quality metrics", "Отчёты и метрики качества"), { kind: "icon", iconId: "chart", color: "#43A58C" }),
  ];
  docs.find(item => item.id === "draft-parent")!.publishedVersion = null;
  const source = docs.find(item => item.id === "source")!;
  const validScope = (scope: ProductDocScope) => {
    if (scope.workspaceId !== moveScope.workspaceId || scope.projectId !== moveScope.projectId) throw new Error("Local preview scope only.");
  };
  const unavailable = async (): Promise<never> => { throw new Error("This local fixture supports reading and moving documents only."); };
  const api: ProductDocsApi = {
    create: unavailable, save: unavailable, publish: unavailable, setArchived: unavailable, delete: unavailable, setAppearance: unavailable,
    listComments: unavailable, postComment: unavailable, getImpact: unavailable, listArticleCases: unavailable,
    listCaseRequirements: unavailable, listRunRequirements: unavailable, linkRequirement: unavailable, unlinkRequirement: unavailable,
    async availability(scope) { validScope(scope); return true; },
    async list(scope, options) {
      validScope(scope); options?.signal?.throwIfAborted();
      const parentId = options?.parentId ?? null, offset = Number(options?.cursor ?? 0);
      const rows = docs.filter(item => item.parentId === parentId), pageSize = parentId === null ? 3 : 40;
      log(`List ${parentId ?? "root"} · page ${Math.floor(offset / pageSize) + 1}`);
      return { nodes: rows.slice(offset, offset + pageSize), nextCursor: offset + pageSize < rows.length ? String(offset + pageSize) : null,
        canEdit: true, canPublish: true, canArchive: true, canDelete: true };
    },
    async get(scope, id, options) {
      validScope(scope); options?.signal?.throwIfAborted();
      const page = docs.find(item => item.id === id);
      if (!page) throw Object.assign(new Error("Missing local page"), { status: 404 });
      return { ...page };
    },
    async move(scope, id, input) {
      validScope(scope);
      const page = docs.find(item => item.id === id);
      if (!page || page.draftVersion !== input.expectedDraftVersion) throw new Error("Local draft changed.");
      if (input.parentId !== null && !docs.some(item => item.id === input.parentId)) throw new Error("Missing local destination.");
      let ancestor = docs.find(item => item.id === input.parentId);
      while (ancestor) {
        if (ancestor.id === id) throw new Error("A document cannot move into its own descendants.");
        ancestor = docs.find(item => item.id === ancestor!.parentId);
      }
      const parent = docs.find(item => item.id === input.parentId);
      if (page.publishedVersion !== null && parent?.publishedVersion === null) {
        throw Object.assign(new Error("Parent must be published"), { code: "PRODUCT_DOC_PARENT_UNPUBLISHED" });
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      page.parentId = input.parentId; page.draftVersion += 1; page.lifecycleVersion = page.draftVersion;
      log(`Memory only: moved ${page.id} → ${input.parentId ?? "root"}`);
      return { draftVersion: page.draftVersion };
    },
  };
  return { api, docs, source, get path() {
    const path: ProductDocNode[] = [];
    let current = docs.find(item => item.id === source.parentId);
    while (current) { path.unshift(current); current = docs.find(item => item.id === current!.parentId); }
    return path;
  } };
}
