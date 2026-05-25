// hooks/usePdfDemoDialog.tsx
'use client';

import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PdfDemoDialog from '../dialog/dialog';

type Options = {
  url?: string;
  rememberKey?: string;
  portalId?: string;
  /** '_self' (дефолт) для стабильного UX со спиннером; '_blank' — новая вкладка без заглушек */
  target?: '_self' | '_blank';
};

export default function usePdfDemoDialog(opts: Options = {}) {
  const url = opts.url ?? '/SG-P.pdf';
  const rememberKey = opts.rememberKey;
  const portalId = opts.portalId ?? 'deck-dialog-portal';
  const target = opts.target ?? '_self';

  const [open, setOpen] = useState(false);
  const [remember, setRemember] = useState(false);
  const portalRef = useRef<HTMLElement | null>(null);

  // Создаём/реюзаем контейнер портала
  useEffect(() => {
    let el = document.getElementById(portalId) as HTMLElement | null;
    if (!el) {
      el = document.createElement('div');
      el.id = portalId;
      el.style.position = 'fixed';
      el.style.inset = '0';
      el.style.zIndex = '2147483647';
      el.style.pointerEvents = 'none';
      document.body.appendChild(el);
    } else {
      el.style.pointerEvents = 'none';
    }
    portalRef.current = el;
    return () => {};
  }, [portalId]);

  // Переключаем хит-тест контейнера
  useEffect(() => {
    const el = portalRef.current;
    if (el) el.style.pointerEvents = open ? 'auto' : 'none';
  }, [open]);

  const navigate = useCallback(() => {
    if (target === '_self') {
      // Стабильный сценарий: спиннер виден, затем навигация в эту же вкладку
      window.location.assign(url);
      return;
    }
    // '_blank' — открываем новую вкладку без заглушек
    const w = window.open(url, '_blank', 'noopener');
    if (w) {
      w.opener = null;
    } else {
      // Fallback если попап заблокирован
      window.location.assign(url);
    }
  }, [url, target]);

  const bypassIfRemembered = useCallback(() => {
    if (!rememberKey) return false;
    try {
      if (localStorage.getItem(rememberKey) === '1') {
        navigate();
        return true;
      }
    } catch {}
    return false;
  }, [rememberKey, navigate]);

  // Вызывать из юзер-жеста (onClick)
  const openDialog = useCallback(() => {
    if (bypassIfRemembered()) return;
    setOpen(true);
    const el = portalRef.current;
    if (el) el.style.pointerEvents = 'auto';
  }, [bypassIfRemembered]);

  const closeDialog = useCallback(() => {
    setOpen(false);
    const el = portalRef.current;
    if (el) el.style.pointerEvents = 'none';
  }, []);

  const confirmView = useCallback(() => {
    try { if (remember && rememberKey) localStorage.setItem(rememberKey, '1'); } catch {}
    // Закрываем оверлей и навигируем
    setOpen(false);
    const el = portalRef.current;
    if (el) el.style.pointerEvents = 'none';
    navigate();
  }, [remember, rememberKey, navigate]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDialog();
      if (e.key === 'Enter') confirmView();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeDialog, confirmView]);

  const Dialog =
    open && portalRef.current
      ? createPortal(
          createElement(PdfDemoDialog, {
            open,
            onClose: closeDialog,
            onConfirm: confirmView,
            remember,
            onToggleRemember: setRemember,
          }),
          portalRef.current,
        )
      : null;

  return { open, openDialog, closeDialog, Dialog, bypassIfRemembered };
}
