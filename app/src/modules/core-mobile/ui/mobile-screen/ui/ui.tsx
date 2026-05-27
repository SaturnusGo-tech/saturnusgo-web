"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "../../../../../shared/i18n";
import { PUBLIC_PAGE_COPY } from "../../../../../shared/i18n/page-copy";

const MobileLottie = dynamic(() => import("../../mobile-lottie"), {
  ssr: false,
});

export default function MobileScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { locale } = useLanguage();
  const copy = PUBLIC_PAGE_COPY[locale].mobile;
  const from = params.get("from") || "/";
  const [confirmOpen, setConfirmOpen] = useState(false);

  const continueAnyway = () => {
    try {
      localStorage.setItem("allowMobile", "1");
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Unable to persist mobile override", error);
      }
    }
    router.replace(from);
  };

  useEffect(() => {
    if (!confirmOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmOpen(false);
      if (event.key === "Enter") continueAnyway();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen]);

  return (
    <main className="sg-page" aria-labelledby="mobile-title">
      <section className="sg-hero">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/device-preview.jpg" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">{copy.hero.kicker}</span>
          <h1 id="mobile-title">{copy.hero.title}</h1>
          <p>{copy.hero.text}</p>
          <div className="sg-actions">
            <button
              className="sg-button"
              type="button"
              onClick={() => setConfirmOpen(true)}
            >
              {copy.hero.primary}
            </button>
          </div>
        </div>
      </section>

      <section className="sg-section sg-light">
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.desktop.kicker}</span>
            <div className="sg-section-copy">
              <h2>{copy.desktop.title}</h2>
              <p>{copy.desktop.text}</p>
            </div>
          </div>
          <div
            style={{ display: "grid", placeItems: "center", minHeight: 260 }}
          >
            <MobileLottie />
          </div>
        </div>
      </section>

      {confirmOpen && (
        <div
          className="sg-mobile-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="sg-mobile-dialog-panel">
            <h2 id="confirm-title">{copy.dialog.title}</h2>
            <p>{copy.dialog.text}</p>
            <div className="sg-actions">
              <button
                className="sg-button"
                type="button"
                onClick={continueAnyway}
              >
                {copy.dialog.continue}
              </button>
              <button
                className="sg-button-ghost"
                type="button"
                onClick={() => setConfirmOpen(false)}
              >
                {copy.dialog.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .sg-mobile-dialog {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(5, 5, 5, 0.74);
          backdrop-filter: blur(18px);
        }

        .sg-mobile-dialog-panel {
          width: min(460px, 100%);
          border-radius: 34px;
          padding: 30px;
          background: #f2eee4;
          color: #080808;
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.34);
        }

        .sg-mobile-dialog-panel h2 {
          margin: 0;
          font-size: 34px;
          line-height: 0.98;
          letter-spacing: -0.06em;
        }

        .sg-mobile-dialog-panel p {
          margin: 16px 0 0;
          color: rgba(8, 8, 8, 0.66);
          line-height: 1.55;
        }

        .sg-mobile-dialog-panel .sg-button-ghost {
          color: #080808;
          border-color: rgba(8, 8, 8, 0.16);
        }
      `}</style>
    </main>
  );
}
