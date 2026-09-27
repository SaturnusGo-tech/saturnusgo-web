import type { PrivateAttachmentClient } from "../../../attachments/application/private-attachment-client";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import { createBuildDraftStore } from "../../builds/application/build-draft-store";
import { resolvePendingOperation, type PendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import { formatTmsMutationFailure, toTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { canEditRunMetadata, metadataPatch, runEditDraft, type RunEditDraft, type RunEditPort, type RunEditResource } from "../model/run-edit";

type State = { phase: "loading" | "ready" | "error"; draft: RunEditDraft; error: string;
  busy: boolean; conflict: boolean; uncertain: boolean; editable: boolean };
export function createRunEditStore(port: RunEditPort, client: PrivateAttachmentClient | null,
  runId: string, projectId: string, ru: boolean, changed: () => void) {
  let state: State = { phase: "loading", draft: { name: "", description: "", tags: "", ownerIdentityId: null },
    error: "", busy: false, conflict: false, uncertain: false, editable: false };
  let baseline: RunEditResource | null = null; let loading: AbortController | null = null; let alive = true;
  let pending: PendingOperation | null = null;
  const builds = createBuildDraftStore(client, () => { if (alive) changed(); }, ru);
  const update = (patch: Partial<State>) => { state = { ...state, ...patch }; if (alive) changed(); };
  const failure = (error: unknown, fallback: string) => formatTmsMutationFailure(toTmsMutationFailure(error), fallback);
  const fieldsEnabled = () => state.phase === "ready" && state.editable && !state.busy && !state.uncertain;
  async function load() {
    if (state.busy) return;
    loading?.abort(); const controller = new AbortController(); loading = controller;
    update({ phase: "loading", error: "" });
    try {
      const result = await port.load(runId, controller.signal);
      if (result.data.projectId !== projectId) throw new Error("Run project changed.");
      const android = result.data.platformBuilds?.find(build => build.platform === "android");
      const ios = result.data.platformBuilds?.find(build => build.platform === "ios");
      if (android && !client) throw new Error("Private attachments are unavailable.");
      const artifact = android ? (await client!.getMetadata(android.attachmentId, controller.signal)).metadata : null;
      controller.signal.throwIfAborted(); if (!alive) return;
      baseline = result; pending = null;
      builds.hydrateExisting(projectId, artifact, android?.version ?? "", ios?.reference ?? "");
      update({ phase: "ready", draft: runEditDraft(result.data), editable: canEditRunMetadata(result.data), conflict: false, uncertain: false });
    } catch (error) {
      if (controller.signal.aborted || !alive) return;
      update({ phase: "error", error: failure(error, ru ? "Не удалось загрузить настройки прогона." : "Could not load run settings.") });
    }
  }
  function validation() {
    if (!state.draft.name.trim()) return ru ? "Введите название прогона." : "Enter a run name.";
    if (state.draft.name.trim().length > 240) return ru ? "Название: до 240 символов." : "Run name: up to 240 characters.";
    const tags = state.draft.tags.split(",").map(tag => tag.trim()).filter(Boolean);
    if (tags.length > 20 || tags.some(tag => tag.length > 64) || new Set(tags).size !== tags.length) {
      return ru ? "До 20 разных тегов, до 64 символов каждый." : "Use up to 20 unique tags, up to 64 characters each.";
    }
    return builds.validationError([projectId]);
  }
  function dirty() {
    if (!baseline || state.phase !== "ready") return false;
    if (builds.uploading() || builds.current(projectId).error || validation()) return true;
    return Object.keys(metadataPatch(baseline.data, state.draft, builds.selection(projectId))).length > 0;
  }
  async function save() {
    if (!baseline || state.busy || state.conflict || state.phase !== "ready" || !state.editable) return null;
    const invalid = validation();
    if (invalid || builds.uploading()) { update({ error: invalid || (ru ? "Дождитесь загрузки файла." : "Wait for the file upload.") }); return null; }
    const patch = metadataPatch(baseline.data, state.draft, builds.selection(projectId));
    if (!Object.keys(patch).length) return baseline.data;
    pending = resolvePendingOperation(pending, JSON.stringify([baseline.etag, patch]));
    update({ busy: true, error: "" }); const retained = builds.beginSubmission([projectId]);
    try {
      const result = await port.save(runId, patch, baseline.etag, pending.key);
      builds.settleSubmission(retained, "saved"); baseline = result;
      update({ draft: runEditDraft(result.data), conflict: false, uncertain: false });
      return alive ? result.data : null;
    } catch (error) {
      const definite = error instanceof TmsApiError && error.status >= 400 && error.status < 500;
      builds.settleSubmission(retained, definite ? "rejected" : "uncertain");
      const conflict = error instanceof TmsApiError && error.status === 412;
      update({ conflict, uncertain: !definite, error: conflict
        ? (ru ? "Прогон изменился. Ваши правки сохранены в форме. Загрузите актуальные данные перед повторным редактированием."
          : "This run changed. Your edits are still in the form. Reload the current data before editing again.")
        : !definite ? (ru ? "Ответ не получен. Повторите сохранение, чтобы проверить результат." : "No confirmed response. Retry saving to check the result.")
          : failure(error, ru ? "Не удалось сохранить прогон." : "Could not save run.") });
      return null;
    } finally { update({ busy: false }); }
  }
  return {
    snapshot: () => state, load, save, dirty, builds, fieldsEnabled,
    patch(value: Partial<RunEditDraft>) { if (fieldsEnabled()) update({ draft: { ...state.draft, ...value }, error: "" }); },
    resume() { alive = true; builds.resume(); },
    dispose() { alive = false; loading?.abort(); builds.dispose(); },
  };
}
