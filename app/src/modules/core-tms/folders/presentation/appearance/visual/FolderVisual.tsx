import { useEffect, useState } from "react";
import { PiFolderOpenDuotone, PiFolderSimpleDuotone } from "react-icons/pi";
import type { FolderAppearance, FolderIconId } from "../../../model/appearance/folder-appearance";
import { useFolderAppearanceContext } from "../../../state/appearance/folder-appearance-context";
import { folderIcons } from "../icons/folder-icons";
import css from "./folder-visual.module.css";

export function FolderVisual({ appearance, folderId, path, projectId, open = false, fallbackIcon }: {
  appearance?: FolderAppearance; folderId?: string; path?: string; projectId?: string; open?: boolean;
  fallbackIcon?: FolderIconId;
}) {
  const context = useFolderAppearanceContext();
  const folder = context.folders.find(item => (!projectId && !context.projectId || item.projectId === (projectId ?? context.projectId)) &&
    (folderId ? item.id === folderId : path && item.path === path));
  const selected = appearance === undefined ? folder?.appearance ?? null : appearance;
  const assetId = selected?.kind === "image" ? selected.assetId : "";
  const gif = selected?.kind === "gif" ? selected : null;
  const [failedGif, setFailedGif] = useState<string | null>(null);
  useEffect(() => { setFailedGif(null); }, [gif?.url]);
  const [image, setImage] = useState<{ assetId: string; url: string } | null>(null);
  const [generation, refresh] = useState(0);
  useEffect(() => {
    if (!assetId || !context.read) { setImage(null); return; }
    const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
    context.read(assetId, controller.signal).then(access => {
      if (controller.signal.aborted) return;
      setImage({ assetId, url: access.url });
      timer = setTimeout(() => refresh(v => v + 1), Math.max(1000, Date.parse(access.expiresAt) - Date.now() - 30_000));
    }).catch(() => { if (!controller.signal.aborted) setImage(null); });
    return () => { controller.abort(); clearTimeout(timer); };
  }, [assetId, context.read, generation]);
  const Default = open ? PiFolderOpenDuotone : PiFolderSimpleDuotone;
  const Icon = selected?.kind === "icon"
    ? selected.iconId === "folder" ? Default : folderIcons[selected.iconId] ?? Default
    : fallbackIcon ? folderIcons[fallbackIcon] ?? Default : Default;
  return <span className={css.visual} data-folder-visual data-kind={selected?.kind ?? "default"}
    title={gif ? "GIF via KLIPY" : undefined} role={gif ? "img" : undefined}
    aria-label={gif ? "GIF via KLIPY" : undefined} aria-hidden={gif ? undefined : true}
    style={{ color: selected?.kind === "icon" && selected.color ? selected.color : "var(--falcon-folder)" }}>
    {gif && failedGif !== gif.url ? <img key={gif.url} src={gif.url} alt="" width={22} height={22}
      referrerPolicy="strict-origin-when-cross-origin" onError={() => setFailedGif(gif.url)} />
      : selected?.kind === "emoji" ? selected.emoji : assetId && image?.assetId === assetId
      ? <img src={image.url} alt="" width={22} height={22} onError={() => { setImage(null); if (generation < 2) refresh(v => v + 1); }} />
      : <Icon size={22} />}
  </span>;
}
