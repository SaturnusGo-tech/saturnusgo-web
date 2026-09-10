"use client";
import { Camera, Trash2 } from "lucide-react";
import { useCallback, useRef } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { ManagedAvatarImage } from "../../../auth/managed/presentation/avatar/ManagedAvatarImage";
import { administrationError } from "../copy/administration-errors";
import styles from "../layout/administration.module.css";

export function ProfileAvatarEditor({ identityId = null, name, hasAvatar, version, client, disabled, onSaved }: {
  readonly identityId?: string | null; readonly name: string; readonly hasAvatar: boolean; readonly version: number;
  readonly client: AdministrationPort; readonly disabled?: boolean; readonly onSaved: () => void;
}) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const field = useRef<HTMLInputElement>(null);
  const command = useAdministrationCommand();
  const load = useCallback((signal: AbortSignal) => client.avatar(identityId, signal), [client, identityId]);
  async function upload(file: File) {
    const saved = await command.execute(JSON.stringify([identityId, version, file.name, file.size, file.lastModified]), async (key, signal) => {
      await client.uploadAvatar(identityId, version, file, key, signal); return true;
    });
    if (saved) onSaved();
  }
  return <section className={styles.section} aria-busy={command.pending} aria-label={ru ? "Фотография профиля" : "Profile photo"}>
    <div className={styles.photoEditor}>
      <ManagedAvatarImage className={styles.profilePhoto} name={name} hasAvatar={hasAvatar} version={version} load={load} />
      <div>
        <div className={styles.photoActions}>
          <button type="button" className={styles.button} disabled={disabled || command.pending} onClick={() => field.current?.click()}>
            <Camera size={16} />{command.pending ? (ru ? "Обрабатываем…" : "Processing…") : ru ? (hasAvatar ? "Изменить фото" : "Добавить фото") : (hasAvatar ? "Change photo" : "Add photo")}
          </button>
          {hasAvatar && <button type="button" className={styles.button} disabled={disabled || command.pending} onClick={() => {
            void command.execute(JSON.stringify([identityId, version, "remove"]), async (_, signal) => {
              await client.removeAvatar(identityId, version, signal); return true;
            }).then((saved) => { if (saved) onSaved(); });
          }}><Trash2 size={15} />{ru ? "Удалить" : "Remove"}</button>}
        </div>
        <p className={styles.hint}>JPG, PNG, WebP · {ru ? "Уменьшим автоматически" : "Resized automatically"}</p>
      </div>
    </div>
    <input ref={field} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={disabled || command.pending}
      onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file); }} />
    {command.error && <p className={styles.error} role="alert">{command.error === "AVATAR_SOURCE_TOO_LARGE"
      ? (ru ? "Фотография слишком большая для обработки. Выберите файл до 25 МБ." : "This photo is too large to process. Choose a file up to 25 MB.")
      : command.error === "INVALID_AVATAR" || command.error === "INVALID_INPUT"
      ? (ru ? "Не удалось прочитать фотографию. Выберите изображение JPG, PNG или WebP." : "Could not read the photo. Choose a JPG, PNG or WebP image.")
      : administrationError(command.error, locale)}</p>}
  </section>;
}
