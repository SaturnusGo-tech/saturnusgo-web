import type { AttachmentUploadPhase } from "../../domain/attachment";
import css from "./uploadProgress.module.css";

export function AttachmentUploadProgress({ phase, name, locale }: {
  phase?: AttachmentUploadPhase; name: string; locale: "ru" | "en";
}) {
  if (!phase) return null;
  const ru = locale === "ru";
  const labels = ru
    ? { preparing: "Подготовка файла", uploading: "Загрузка файла", finalizing: "Сохранение вложения", ready: "Файл сохранён", error: "Файл не сохранён" }
    : { preparing: "Preparing file", uploading: "Uploading file", finalizing: "Saving attachment", ready: "File saved", error: "File not saved" };
  if (phase === "error") return <span className={css.error} role="status">{labels.error}</span>;
  return <span className={css.track} data-phase={phase} role="progressbar"
    aria-label={`${labels[phase]}: ${name}`} aria-valuemin={0} aria-valuemax={100}
    aria-valuenow={phase === "ready" ? 100 : undefined} aria-valuetext={labels[phase]}>
    <span className={css.fill} />
  </span>;
}
