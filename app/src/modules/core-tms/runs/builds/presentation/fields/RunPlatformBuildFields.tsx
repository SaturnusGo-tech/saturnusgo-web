import { Upload, X } from "lucide-react";
import { useId, useRef } from "react";
import type { useRunPlatformBuilds } from "../../state/useRunPlatformBuilds";
import { AnimatedSelect } from "../../../../presentation/common/select/AnimatedSelect";
import { iosReferenceError } from "../../model/ios-reference";
import css from "./buildFields.module.css";

export function RunPlatformBuildFields({ controller, projects, disabled, ru }: {
  controller: ReturnType<typeof useRunPlatformBuilds>;
  projects: readonly { id: string; name: string }[]; disabled: boolean; ru: boolean;
}) {
  const input = useRef<HTMLInputElement>(null); const id = useId(); const draft = controller.current;
  const iosError = iosReferenceError(draft.iosReference, ru);
  const uploading = ["preparing", "uploading", "finalizing"].includes(draft.phase);
  const phases = ru ? { preparing: "Подготавливаем файл…", uploading: "Загружаем файл…", finalizing: "Проверяем загрузку…" }
    : { preparing: "Preparing file…", uploading: "Uploading file…", finalizing: "Checking upload…" };
  return <div className={css.fields}>
    {projects.length > 1 && <div className={css.field}>
      <span>{ru ? "Сборки проекта" : "Builds for project"}</span>
      <AnimatedSelect label={ru ? "Проект сборки" : "Build project"} value={controller.projectId}
        options={projects.map((project) => ({ value: project.id, label: project.name }))}
        disabled={disabled} onChange={controller.setProjectId} />
    </div>}
    <section className={css.platform} aria-labelledby={`${id}-android`}>
      <h3 id={`${id}-android`}>Android</h3>
      <label className={css.field}><span>{ru ? "Версия" : "Version"}</span>
        <input value={draft.androidVersion} disabled={disabled} maxLength={200}
          placeholder={ru ? "Например, 2.4.0 (124)" : "For example, 2.4.0 (124)"}
          onChange={(event) => controller.setAndroidVersion(event.target.value)} /></label>
      <div className={css.upload}>
        <input ref={input} className={css.fileInput} type="file" disabled={disabled || uploading}
          aria-label={ru ? "Файл сборки Android" : "Android build file"}
          onChange={(event) => { const file = event.target.files?.[0]; if (file) controller.chooseFile(file); event.target.value = ""; }} />
        <button type="button" className={css.uploadButton} disabled={disabled || uploading}
          onClick={() => input.current?.click()}><Upload size={14} />
          {draft.file || draft.artifact ? (ru ? "Заменить файл" : "Replace file") : (ru ? "Загрузить файл" : "Upload file")}</button>
        {(draft.file || draft.artifact) && <div className={css.filename}>
          <span title={draft.file?.name ?? draft.artifact?.originalFilename}>{draft.file?.name ?? draft.artifact?.originalFilename}</span>
          <button type="button" disabled={disabled} onClick={uploading ? controller.cancelUpload : controller.removeFile}
            aria-label={uploading ? (ru ? "Отменить загрузку Android" : "Cancel Android upload") : (ru ? "Убрать файл Android" : "Remove Android file")}><X size={14} /></button>
        </div>}
        {uploading && <p role="status" className={css.hint}>{phases[draft.phase as keyof typeof phases]}</p>}
        {draft.phase === "ready" && <p role="status" className={css.hint}>{ru ? "Файл загружен" : "File uploaded"}</p>}
        {(draft.phase === "error" || draft.phase === "cancelled") && draft.file && <button type="button" className={css.retry}
          disabled={disabled} onClick={controller.retryUpload}>{ru ? "Повторить загрузку" : "Retry upload"}</button>}
        <p className={css.hint}>{ru ? "APK, ZIP или другой файл до 500 МиБ. Для Android нужен файл сборки." : "APK, ZIP, or another file up to 500 MiB. Android builds require a file."}</p>
        {draft.error && <p role="alert" className={css.error}>{draft.error}</p>}
        {draft.androidVersion.trim() && !draft.file && !draft.artifact && <p className={css.error}>
          {ru ? "Добавьте файл для этой версии Android." : "Add the file for this Android version."}</p>}
      </div>
    </section>
    <section className={css.platform} aria-labelledby={`${id}-ios`}>
      <h3 id={`${id}-ios`}>iOS</h3>
      <label className={css.field}><span>{ru ? "Версия или ссылка" : "Version or link"}</span>
        <input value={draft.iosReference} disabled={disabled} maxLength={500} aria-invalid={Boolean(iosError)}
          placeholder={ru ? "Версия, TestFlight или ссылка" : "Version, TestFlight, or a link"}
          onChange={(event) => controller.setIosReference(event.target.value)} /></label>
      <p className={css.hint}>{ru ? "Необязательно. Файл загружать не нужно." : "Optional. No file upload needed."}</p>
      {iosError && <p className={css.error}>{iosError}</p>}
    </section>
  </div>;
}
