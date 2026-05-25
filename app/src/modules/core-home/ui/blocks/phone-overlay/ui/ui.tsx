"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import styles from "../styles/styles.module.css";

export type VideoDef = {
  src: string;
  poster?: string;
};

type PhoneOverlayContextValue = {
  open: (videos: VideoDef[], index?: number) => void;
  close: () => void;
};

const PhoneOverlayContext = createContext<PhoneOverlayContextValue | null>(null);

export function PhoneOverlayProvider({ children }: { children: ReactNode }) {
  const [videos, setVideos] = useState<VideoDef[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeVideo = videos[activeIndex] ?? null;

  const close = useCallback(() => {
    setVideos([]);
    setActiveIndex(0);
  }, []);

  const open = useCallback((nextVideos: VideoDef[], index = 0) => {
    setVideos(nextVideos);
    setActiveIndex(Math.max(0, Math.min(index, nextVideos.length - 1)));
  }, []);

  const value = useMemo(() => ({ open, close }), [close, open]);

  return (
    <PhoneOverlayContext.Provider value={value}>
      {children}
      {activeVideo ? (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Product preview">
          <div className={styles.frame}>
            <button className={styles.close} type="button" onClick={close} aria-label="Close preview">×</button>
            <video
              className={styles.video}
              src={activeVideo.src}
              poster={activeVideo.poster}
              autoPlay
              muted
              loop
              playsInline
              controls={false}
            />
          </div>
        </div>
      ) : null}
    </PhoneOverlayContext.Provider>
  );
}

export function usePhoneOverlay(): PhoneOverlayContextValue {
  const value = useContext(PhoneOverlayContext);

  if (!value) {
    throw new Error("usePhoneOverlay must be used inside PhoneOverlayProvider");
  }

  return value;
}
