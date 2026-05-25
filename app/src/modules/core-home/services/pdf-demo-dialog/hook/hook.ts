"use client";

import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import PdfDemoDialog from "../dialog/dialog";

type PdfDemoDialogOptions = {
  url?: string;
  rememberKey?: string;
  portalId?: string;
  target?: "_self" | "_blank";
};

export default function usePdfDemoDialog(options: PdfDemoDialogOptions = {}) {
  const url = options.url ?? "/SG-P.pdf";
  const rememberKey = options.rememberKey;
  const portalId = options.portalId ?? "deck-dialog-portal";
  const target = options.target ?? "_self";
  const [isOpen, setIsOpen] = useState(false);
  const portalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let element = document.getElementById(portalId) as HTMLElement | null;

    if (!element) {
      element = document.createElement("div");
      element.id = portalId;
      document.body.appendChild(element);
    }

    element.style.position = "fixed";
    element.style.inset = "0";
    element.style.zIndex = "2147483647";
    element.style.pointerEvents = "none";
    portalRef.current = element;
  }, [portalId]);

  useEffect(() => {
    const element = portalRef.current;

    if (element) {
      element.style.pointerEvents = isOpen ? "auto" : "none";
    }
  }, [isOpen]);

  const navigate = useCallback(() => {
    if (target === "_self") {
      window.location.assign(url);
      return;
    }

    const nextWindow = window.open(url, "_blank", "noopener");

    if (nextWindow) {
      nextWindow.opener = null;
      return;
    }

    window.location.assign(url);
  }, [target, url]);

  const shouldBypassDialog = useCallback(() => {
    if (!rememberKey) {
      return false;
    }

    try {
      return window.localStorage.getItem(rememberKey) === "1";
    } catch (error) {
      console.warn("Unable to read deck dialog preference", error);
      return false;
    }
  }, [rememberKey]);

  const openDialog = useCallback(() => {
    if (shouldBypassDialog()) {
      navigate();
      return;
    }

    setIsOpen(true);
  }, [navigate, shouldBypassDialog]);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  const confirmView = useCallback(() => {
    setIsOpen(false);
    navigate();
  }, [navigate]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDialog();
      }

      if (event.key === "Enter") {
        confirmView();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDialog, confirmView, isOpen]);

  const Dialog = isOpen && portalRef.current
    ? createPortal(
      createElement(PdfDemoDialog, {
        open: isOpen,
        onClose: closeDialog,
        onConfirm: confirmView,
      }),
      portalRef.current,
    )
    : null;

  return { open: isOpen, openDialog, closeDialog, Dialog, bypassIfRemembered: shouldBypassDialog };
}
