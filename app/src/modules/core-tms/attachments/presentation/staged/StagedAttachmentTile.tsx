import { FileText, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fileExtension, getFilePreviewKind } from "../library/preview/model/file-preview-format";
import css from "./staged-attachment-tile.module.css";

export function StagedAttachmentTile({ file, locale, disabled, onRemove }: {
  file: File; locale: "ru" | "en"; disabled: boolean; onRemove: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState("");
  const [failed, setFailed] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const kind = getFilePreviewKind(file.name, file.type);
  const media = kind === "image" || kind === "video";
  const ru = locale === "ru";
  const extension = fileExtension(file.name).toUpperCase() || (ru ? "ФАЙЛ" : "FILE");
  const size = file.size < 1024 ? `${file.size} ${ru ? "Б" : "B"}` : new Intl.NumberFormat(locale, {
    style: "unit", unit: file.size < 1024 ** 2 ? "kilobyte" : "megabyte", maximumFractionDigits: 1,
  }).format(file.size / (file.size < 1024 ** 2 ? 1024 : 1024 ** 2));
  const time = `${Math.floor(duration / 60).toString().padStart(2, "0")}:${Math.floor(duration % 60).toString().padStart(2, "0")}`;
  useEffect(() => {
    setFailed(false); setDuration(0); setPlaying(false);
    if (!media) { setSource(""); return; }
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file, media]);
  return <li className={css.tile}>
    <div className={css.preview}>
      {source && !failed && kind === "image" && <img src={source} alt={file.name} loading="lazy" decoding="async"
        onError={() => setFailed(true)} />}
      {source && !failed && kind === "video" && <video ref={video} src={source} preload="metadata" playsInline
        controls={playing} aria-label={file.name} onError={() => { setFailed(true); setPlaying(false); }}
        onLoadedMetadata={event => {
          const clip = event.currentTarget;
          setDuration(Number.isFinite(clip.duration) ? clip.duration : 0);
          if (clip.duration > 0) clip.currentTime = Math.min(.01, clip.duration / 2);
        }} />}
      {(!media || failed) && <div className={css.fallback} aria-label={`${extension} ${ru ? "файл" : "file"}`}>
        <FileText size={36} strokeWidth={1.25} aria-hidden="true" /><span>{extension}</span>
      </div>}
      {source && !failed && kind === "video" && !playing && <button type="button" className={css.play}
        aria-label={`${ru ? "Воспроизвести" : "Play"} ${file.name}`} onClick={() => {
          setPlaying(true);
          void video.current?.play().catch(() => setPlaying(false));
        }}><Play size={23} fill="currentColor" strokeWidth={0} aria-hidden="true" /></button>}
      {!failed && duration > 0 && !playing && <span className={css.duration}>{time}</span>}
      <button type="button" className={css.remove} disabled={disabled}
        aria-label={`${ru ? "Удалить файл" : "Remove file"} ${file.name}`}
        onClick={() => { if (!disabled) onRemove(); }}><X size={15} aria-hidden="true" /></button>
    </div>
    <span className={css.name} title={file.name}>{file.name}</span>
    <span className={css.detail}>{size} <span aria-hidden="true">·</span> {extension}</span>
  </li>;
}
