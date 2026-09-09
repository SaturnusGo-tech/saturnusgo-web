"use client";
import { Maximize2, Pause, Play, RotateCcw } from "lucide-react";
import { useId } from "react";
import type { ProductDemo } from "../content/demos";
import { useProductPlayback } from "./useProductPlayback";
import styles from "./video.module.css";
function time(value: number) {
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
}
export function ProductVideo({
  demo,
  priority = false,
}: {
  demo: ProductDemo;
  priority?: boolean;
}) {
  const player = useProductPlayback();
  const id = useId();
  return (
    <figure className={styles.figure} aria-labelledby={id}>
      <div className={styles.frame} ref={player.frame}>
        <video
          ref={player.video}
          className={styles.video}
          poster={demo.poster}
          src={player.load ? demo.src : undefined}
          preload={player.load ? "metadata" : "none"}
          muted
          loop
          playsInline
          aria-label={demo.title}
          aria-describedby={`${id}-description`}
          onLoadedData={player.ready}
          onLoadedMetadata={player.onMetadata}
          onTimeUpdate={player.onTime}
          onPlay={player.onPlay}
          onPause={player.onPause}
          onError={player.onError}
        >
          {player.load && (
            <track
              kind="captions"
              src={demo.captions}
              srcLang="ru"
              label="Русский"
            />
          )}
        </video>
        {priority && <link rel="preload" as="image" href={demo.poster} />}
        {player.failed && (
          <div className={styles.error} role="status">
            <p>Видео не загрузилось</p>
            <button onClick={player.retry}>
              <RotateCcw size={16} aria-hidden="true" />
              Повторить
            </button>
          </div>
        )}
        <div
          className={styles.controls}
          aria-label={`Управление видео: ${demo.title}`}
        >
          <button
            onClick={player.toggle}
            aria-label={
              player.playing
                ? `Пауза: ${demo.title}`
                : `Смотреть: ${demo.title}`
            }
            disabled={player.failed}
          >
            {player.playing ? (
              <Pause size={17} fill="currentColor" aria-hidden="true" />
            ) : (
              <Play size={17} fill="currentColor" aria-hidden="true" />
            )}
          </button>
          <span className={styles.time}>
            {time(player.position)}
            <span> / {time(player.duration)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={player.duration || 1}
            step={0.1}
            value={player.position}
            disabled={!player.duration}
            aria-label={`Позиция видео: ${demo.title}`}
            aria-valuetext={`${time(player.position)} из ${time(player.duration)}`}
            onChange={(event) => player.seek(Number(event.target.value))}
          />
          <span className={styles.silent}>Без звука</span>
          <button
            aria-label={`На весь экран: ${demo.title}`}
            onClick={() => {
              const video = player.video.current as
                | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
                | null;
              if (document.fullscreenEnabled)
                void player.frame.current
                  ?.requestFullscreen()
                  .catch(() => video?.webkitEnterFullscreen?.());
              else video?.webkitEnterFullscreen?.();
            }}
          >
            <Maximize2 size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <figcaption className={styles.caption}>
        <div>
          <strong id={id}>{demo.title}</strong>
          <p id={`${id}-description`}>{demo.description}</p>
        </div>
        <details className={styles.transcript}>
          <summary>Что в видео</summary>
          <p>{demo.transcript}</p>
        </details>
      </figcaption>
    </figure>
  );
}
