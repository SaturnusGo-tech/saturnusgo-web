// app/shared/toast/Toast.tsx
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as ReactDOM from 'react-dom';
import { AnimatePresence, m, useReducedMotion, type PanInfo } from 'framer-motion';

/* =======================================================================================
   Modern 2025 Toast (iOS-like push banner, glass, drag-to-dismiss, swap-on-new)
   - Top-right, global, portal → no z-index fights, visible over scroll
   - Swap-on-new (no flicker), shared spring transitions, crossfade content
   - Pause on hover/drag/page blur; progress bar syncs with remaining time
   - Drag to dismiss (velocity/threshold), ESC to close, ARIA polite
   - Reduced motion support, safe-areas, gradient icon, action CTA
   ======================================================================================= */

type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastOptions = {
  message: string;
  subMessage?: string;
  type?: ToastType;
  duration?: number; // ms (default 5000)
  actionLabel?: string;
  onAction?: () => void;
};

type ToastWithId = ToastOptions & { id: number };

type ToastContextValue = {
  show: (opts: ToastOptions) => void;
};

const ToastCtx = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider/>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastWithId | null>(null);
  const [pending, setPending] = useState<ToastWithId | null>(null);
  const [phase, setPhase] = useState<'idle' | 'in' | 'hold' | 'out'>('idle');

  const show = useCallback(
    (opts: ToastOptions) => {
      const t: ToastWithId = { id: Date.now(), ...opts };
      if (!current && phase === 'idle') {
        setCurrent(t);
        setPhase('in');
      } else {
        setPending(t);
        setPhase('out');
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any)?.vibrate?.(8);
      } catch {}
    },
    [current, phase]
  );

  useEffect(() => {
    if (!current) return;
    if (phase === 'in') {
      const t = setTimeout(() => setPhase('hold'), 26);
      return () => clearTimeout(t);
    }
  }, [phase, current]);

  const onExited = useCallback(() => {
    if (pending) {
      setCurrent(pending);
      setPending(null);
      setPhase('in');
    } else {
      setCurrent(null);
      setPhase('idle');
    }
  }, [pending]);

  const ctx = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      <ToastViewport
        toast={current}
        phase={phase}
        onRequestClose={() => setPhase('out')}
        onExited={onExited}
      />
    </ToastCtx.Provider>
  );
}

/* -------------------------------- Viewport (Portal) ---------------------------------- */

function ToastViewport({
  toast,
  phase,
  onRequestClose,
  onExited,
}: {
  toast: ToastWithId | null;
  phase: 'idle' | 'in' | 'hold' | 'out';
  onRequestClose: () => void;
  onExited: () => void;
}) {
  // Always declare the same hooks every render (fixes "Rendered more hooks..." error)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create and attach once on mount (client-only)
    const el = document.createElement('div');
    setPortalEl(el);
    document.body.appendChild(el);
    return () => {
      try {
        document.body.removeChild(el);
      } catch {}
    };
  }, []);

  // Until portal is ready, render nothing — hooks count remains constant
  if (!portalEl) return null;

  return ReactDOM.createPortal(
    <>
      <div className="toastViewport" role="region" aria-label="Notifications" />
      <AnimatePresence initial={false} mode="sync" onExitComplete={onExited}>
        {toast && (
          <ToastBanner
            key={toast.id}
            toast={toast}
            active={phase === 'in' || phase === 'hold'}
            requestClose={onRequestClose}
          />
        )}
      </AnimatePresence>

      <style jsx>{viewportCss}</style>
    </>,
    portalEl
  );
}

/* --------------------------------- Banner (Motion) ----------------------------------- */

function ToastBanner({
  toast,
  active,
  requestClose,
}: {
  toast: ToastWithId;
  active: boolean;
  requestClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);

  // Precise, pauseable countdown
  const total = toast.duration ?? 5000;
  const remainingRef = useRef(total);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const cancelLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startedAtRef.current = null;
  }, []);

  const tick = useCallback(() => {
    if (paused) return;
    if (startedAtRef.current == null) startedAtRef.current = performance.now();
    const elapsed = performance.now() - startedAtRef.current;
    const left = Math.max(0, remainingRef.current - elapsed);
    if (left <= 0) {
      cancelLoop();
      requestClose();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [paused, requestClose, cancelLoop]);

  const startLoop = useCallback(() => {
    startedAtRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    if (paused) return;
    setPaused(true);
    if (startedAtRef.current != null) {
      const elapsed = performance.now() - startedAtRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    }
    cancelLoop();
  }, [paused, cancelLoop]);

  const resume = useCallback(() => {
    if (!paused) return;
    setPaused(false);
    startLoop();
  }, [paused, startLoop]);

  // Start/stop countdown + page visibility handling
  useEffect(() => {
    if (!active) return;
    startLoop();
    const onVis = () => (document.hidden ? pause() : resume());
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      cancelLoop();
    };
  }, [active, startLoop, pause, resume, cancelLoop]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose]);

  // Drag to dismiss
  const onDragEnd = (_: unknown, info: PanInfo) => {
    const velocity = info.velocity.x;
    const offset = info.offset.x;
    const pass = Math.abs(velocity) > 600 || Math.abs(offset) > 120;
    if (pass) requestClose();
  };

  const type = toast.type ?? 'info';
  const icon = TYPE_ICON[type];

  const progressStyle = {
    ['--dur' as any]: `${Math.max(0, remainingRef.current)}ms`,
    ['--play' as any]: paused ? 'paused' : 'running',
  };

  return (
    <>
      <m.div
        className="toastWrap"
        initial={{ x: 420, y: 0, opacity: 0, scale: reduce ? 1 : 0.98, filter: 'blur(6px)' }}
        animate={{
          x: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          transition: {
            type: reduce ? 'tween' : 'spring',
            stiffness: 520,
            damping: 38,
            mass: 0.7,
            duration: reduce ? 0.28 : undefined,
          },
        }}
        exit={{
          x: 460,
          opacity: 0,
          scale: reduce ? 1 : 0.98,
          filter: 'blur(6px)',
          transition: { type: 'tween', duration: 0.32, ease: [0.2, 0.8, 0.2, 1] },
        }}
        drag="x"
        dragElastic={0.28}
        dragMomentum
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={pause}
        onDragEnd={onDragEnd}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}
        role="status"
        aria-live="polite"
        style={progressStyle as React.CSSProperties}
      >
        {/* Progress */}
        <div className="toast__progress" aria-hidden />

        {/* Rail */}
        <div className={`toast__rail ${type}`} aria-hidden />

        {/* Icon */}
        <div className="toast__icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <defs>
              <linearGradient id="tgrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF6066" />
                <stop offset="50%" stopColor="#C252FE" />
                <stop offset="100%" stopColor="#475BFF" />
              </linearGradient>
            </defs>
            <path d={icon} fill="url(#tgrad)" />
          </svg>
        </div>

        {/* Texts */}
        <div className="toast__texts">
          <m.div
            className="toast__title"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { duration: 0.18, delay: 0.02} }}
            exit={{ y: -4, opacity: 0, transition: { duration: 0.14 } }}
          >
            {toast.message}
          </m.div>
          {toast.subMessage && (
            <m.div
              className="toast__subtitle"
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 0.86, transition: { duration: 0.2, delay: 0.05 } }}
              exit={{ y: -4, opacity: 0, transition: { duration: 0.14 } }}
            >
              {toast.subMessage}
            </m.div>
          )}
        </div>

        {/* CTA */}
        {toast.onAction && (
          <button
            className="toast__cta"
            onClick={() => {
              toast.onAction?.();
              requestClose();
            }}
          >
            {toast.actionLabel ?? 'Open'}
            <svg viewBox="0 0 24 24" width="18" height="18" className="toast__ctaIcon" aria-hidden>
              <path
                d="M9 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Close */}
        <button className="toast__close" onClick={requestClose} aria-label="Close notification">
          ×
        </button>
      </m.div>

      <style jsx>{bannerCss}</style>
    </>
  );
}

/* ------------------------------- Styles (scoped) ------------------------------------- */

const viewportCss = /* css */ `
.toastViewport{
  position: fixed;
  top: calc(14px + env(safe-area-inset-top, 0px));
  right: calc(14px + env(safe-area-inset-right, 0px));
  z-index: 9999;
  pointer-events: none;
}
`;

const bannerCss = /* css */ `
.toastWrap{
  pointer-events: auto;
  position: fixed;
  top: calc(14px + env(safe-area-inset-top, 0px));
  right: calc(14px + env(safe-area-inset-right, 0px));
  min-width: 320px;
  max-width: min(92vw, 560px);
  display: grid;
  grid-template-columns: 4px 36px 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 12px 10px;

  color: rgba(255,255,255,0.96);
  background: rgba(22,22,24,0.86);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 18px;
  backdrop-filter: saturate(140%) blur(12px);
  box-shadow: 0 18px 50px rgba(0,0,0,0.38), 0 1px 0 rgba(255,255,255,0.06) inset;

  will-change: transform, opacity, filter;
  contain: layout paint style;
}

/* progress (pauseable via --play) */
.toast__progress{
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #FFD60A, #FF9F0A);
  transform-origin: left;
  animation: toastProgress var(--dur) linear forwards;
  animation-play-state: var(--play, running);
}
@keyframes toastProgress { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* left rail (by type) */
.toast__rail{ grid-column: 1; grid-row: 1 / span 3; width: 4px; height: 100%; background: #2A2A2E; border-radius: 8px; }
.toast__rail.success{ background: #264e2f; }
.toast__rail.error{ background: #4e2626; }
.toast__rail.warning{ background: #4e4a26; }
.toast__rail.info{ background: #263c4e; }

/* icon */
.toast__icon{
  width: 36px; height: 36px;
  border-radius: 10px;
  background: rgba(255,255,255,0.08);
  display: grid; place-items: center;
  border: 1px solid rgba(255,255,255,0.08);
}

/* text */
.toast__texts{ min-width: 0; }
.toast__title{
  font-size: 15px; font-weight: 600; line-height: 1.25;
  text-wrap: balance;
}
.toast__subtitle{ margin-top: 2px; font-size: 13px; opacity: .86; line-height: 1.3; }

/* CTA */
.toast__cta{
  all: unset; cursor: pointer;
  display:flex; align-items:center; gap:6px;
  padding: 6px 8px; border-radius: 10px;
  background: rgba(255,255,255,0.08);
  color: #FFD60A;
  border: 1px solid rgba(255,255,255,0.1);
}
.toast__cta:hover{ background: rgba(255,255,255,0.12); }
.toast__cta:focus-visible{ outline: 2px solid rgba(255,214,10,0.6); outline-offset: 2px; }
.toast__ctaIcon{ opacity: .95; }

/* close */
.toast__close{
  all: unset; cursor: pointer; font-size: 18px; line-height: 1;
  padding: 4px 8px; border-radius: 10px; opacity: .9;
}
.toast__close:hover{ background: rgba(255,255,255,0.08); }
.toast__close:focus-visible{ outline: 2px solid rgba(255,255,255,0.3); outline-offset: 2px; }
`;

/* -------------------------------- Icons (paths) -------------------------------------- */

const TYPE_ICON: Record<ToastType, string> = {
  success: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M10.2 13.6l-2.4-2.4-1.4 1.4 3.8 3.8 7-7-1.4-1.4-5.6 5.6z',
  error:   'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M8.7 8.7l6.6 6.6m0-6.6l-6.6 6.6',
  warning: 'M12 2l10 18H2L12 2zm0 6v6m0 4h.01',
  info:    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 7.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm-1.2 4h2.4v6h-2.4z',
};

export default ToastProvider;
