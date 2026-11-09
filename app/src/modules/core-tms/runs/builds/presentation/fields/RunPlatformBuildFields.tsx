import { Button, Input, Select, SelectItem } from "@heroui/react";
import { Upload, X } from "lucide-react";
import { useId, useRef } from "react";
import type { useRunPlatformBuilds } from "../../state/useRunPlatformBuilds";
import { iosReferenceError } from "../../model/ios-reference";
import css from "./buildFields.module.css";

const fieldClasses = { base: css.field, label: css.label, inputWrapper: css.control, innerWrapper: css.inner, input: css.input };

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
    {projects.length > 1 && <Select label={ru ? "Сборки проекта" : "Builds for project"} labelPlacement="outside"
      placeholder={ru ? "Выберите проект" : "Choose a project"} size="sm" variant="flat" isDisabled={disabled} disallowEmptySelection selectedKeys={[controller.projectId]}
      classNames={{ base: css.field, label: css.label, trigger: css.control, value: css.input, popoverContent: css.projectOptions }}
      onSelectionChange={keys => {
        if (keys === "all") return;
        const [projectId] = keys;
        if (typeof projectId === "string") controller.setProjectId(projectId);
      }}>
      {projects.map(project => <SelectItem key={project.id}>{project.name}</SelectItem>)}
    </Select>}
    <section className={css.platform} aria-labelledby={`${id}-android`}>
      <h3 id={`${id}-android`}>Android</h3>
      <Input label={ru ? "Версия" : "Version"} labelPlacement="outside-top" size="sm" variant="flat" classNames={fieldClasses}
        value={draft.androidVersion} isDisabled={disabled} maxLength={200}
        placeholder={ru ? "Например, 2.4.0 (124)" : "For example, 2.4.0 (124)"}
        onValueChange={controller.setAndroidVersion} />
      <div className={css.upload}>
        <input ref={input} className={css.fileInput} type="file" disabled={disabled || uploading}
          aria-label={ru ? "Файл сборки Android" : "Android build file"}
          onChange={(event) => { const file = event.target.files?.[0]; if (file) controller.chooseFile(file); event.target.value = ""; }} />
        <Button type="button" size="sm" variant="light" disableRipple className={css.uploadButton} isDisabled={disabled || uploading}
          onPress={() => input.current?.click()}><Upload size={14} />
          {draft.file || draft.artifact ? (ru ? "Заменить файл" : "Replace file") : (ru ? "Загрузить файл" : "Upload file")}</Button>
        {(draft.file || draft.artifact) && <div className={css.filename}>
          <span title={draft.file?.name ?? draft.artifact?.originalFilename}>{draft.file?.name ?? draft.artifact?.originalFilename}</span>
          <Button type="button" size="sm" variant="light" disableRipple isIconOnly isDisabled={disabled} onPress={uploading ? controller.cancelUpload : controller.removeFile}
            aria-label={uploading ? (ru ? "Отменить загрузку Android" : "Cancel Android upload") : (ru ? "Убрать файл Android" : "Remove Android file")}><X size={14} aria-hidden="true" /></Button>
        </div>}
        {uploading && <p role="status" className={css.hint}>{phases[draft.phase as keyof typeof phases]}</p>}
        {draft.phase === "ready" && <p role="status" className={css.hint}>{ru ? "Файл загружен" : "File uploaded"}</p>}
        {(draft.phase === "error" || draft.phase === "cancelled") && draft.file && <Button type="button" size="sm" variant="light" disableRipple className={css.retry}
          isDisabled={disabled} onPress={controller.retryUpload}>{ru ? "Повторить загрузку" : "Retry upload"}</Button>}
        <p className={css.hint}>{ru ? "APK, ZIP или другой файл до 500 МиБ. Для Android нужен файл сборки." : "APK, ZIP, or another file up to 500 MiB. Android builds require a file."}</p>
        {draft.error && <p role="alert" className={css.error}>{draft.error}</p>}
        {draft.androidVersion.trim() && !draft.file && !draft.artifact && <p className={css.error}>
          {ru ? "Добавьте файл для этой версии Android." : "Add the file for this Android version."}</p>}
      </div>
    </section>
    <section className={css.platform} aria-labelledby={`${id}-ios`}>
      <h3 id={`${id}-ios`}>iOS</h3>
      <Input label={ru ? "Версия или ссылка" : "Version or link"} labelPlacement="outside-top" size="sm" variant="flat"
        classNames={fieldClasses} value={draft.iosReference} isDisabled={disabled} maxLength={500} isInvalid={Boolean(iosError)}
        placeholder={ru ? "Версия, TestFlight или ссылка" : "Version, TestFlight, or a link"}
        onValueChange={controller.setIosReference} />
      <p className={css.hint}>{ru ? "Необязательно. Файл загружать не нужно." : "Optional. No file upload needed."}</p>
      {iosError && <p className={css.error}>{iosError}</p>}
    </section>
  </div>;
}
