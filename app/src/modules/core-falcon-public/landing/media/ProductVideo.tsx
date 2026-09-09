"use client";
import { LoaderCircle, Maximize2, Pause, Play, RotateCcw } from "lucide-react";
import { useId, useRef } from "react";
import type { ProductDemo } from "../content/demos";
import { useProductPlayback } from "./useProductPlayback";
import { useProductTimeline } from "./useProductTimeline";
import { formatPlaybackTime } from "./playback-timeline";
import styles from "./video.module.css";
export function ProductVideo({
  demo,
  priority = false,
}: {
  demo: ProductDemo;
  priority?: boolean;
}) {
  const player = useProductPlayback();
  const timeline = useProductTimeline(player.video);
  const id = useId();
  const playbackControl = useRef<HTMLButtonElement>(null);
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
          playsInline
          aria-label={demo.title}
          aria-describedby={`${id}-description`}
          onLoadedMetadata={player.onMetadata}
          onDurationChange={player.onMetadata}
          onPlay={player.onPlay}
          onPause={player.onPause}
          onEnded={player.onEnded}
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
        {!player.playing && !player.failed && (
          <div className={styles.playOverlay}>
            <button
              className={styles.playButton}
              disabled={!player.interactive}
              onClick={() => {
                player.toggle();
                playbackControl.current?.focus({ preventScroll: true });
              }}
              aria-label={
                player.starting
                  ? `Отменить запуск: ${demo.title}`
                  : `Воспроизвести видео: ${demo.title}`
              }
            >
              {player.starting ? (
                <LoaderCircle
                  size={25}
                  className={styles.spinner}
                  aria-hidden="true"
                />
              ) : (
                <Play size={25} fill="currentColor" aria-hidden="true" />
              )}
            </button>
          </div>
        )}
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
            ref={playbackControl}
            onClick={player.toggle}
            aria-label={
              player.playing || player.starting
                ? `Пауза: ${demo.title}`
                : `Смотреть: ${demo.title}`
            }
            disabled={!player.interactive || player.failed}
          >
            {player.playing || player.starting ? (
              <Pause size={17} fill="currentColor" aria-hidden="true" />
            ) : (
              <Play size={17} fill="currentColor" aria-hidden="true" />
            )}
          </button>
          <span className={styles.time}>
            <span ref={timeline.elapsed}>0:00</span>
            <span className={styles.duration}>
              {" "}
              / {formatPlaybackTime(player.duration)}
            </span>
          </span>
          <input
            type="range"
            ref={timeline.range}
            min={0}
            max={player.duration || 1}
            step="any"
            defaultValue={0}
            disabled={!player.duration || player.failed}
            aria-label={`Позиция видео: ${demo.title}`}
            onPointerDown={timeline.beginScrub}
            onKeyDown={timeline.onKeyDown}
            onChange={(event) => timeline.seek(event.target.valueAsNumber)}
          />
          <span className={styles.silent}>Без звука</span>
          <button
            disabled={!player.interactive}
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
