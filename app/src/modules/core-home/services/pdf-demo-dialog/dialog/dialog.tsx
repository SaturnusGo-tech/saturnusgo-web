"use client";

import { useEffect } from "react";

import styles from "../styles/styles.module.css";

type PdfDemoDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function PdfDemoDialog({ open, onClose, onConfirm }: PdfDemoDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onConfirm();
      onClose();
    }, 850);

    return () => window.clearTimeout(timeoutId);
  }, [onClose, onConfirm, open]);

  if (!open) {
    return null;
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Opening deck" className={styles.dialog}>
      <div className={styles.card}>
        <div className={styles.spinner} aria-hidden />
        <h2 className={styles.title}>Opening deck</h2>
        <p className={styles.text}>Preparing the SaturnusGo investor deck in a separate tab.</p>
        <div className={styles.actions}>
          <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={onClose}>
            Cancel
          </button>
          <button className={styles.button} type="button" onClick={onConfirm}>
            Open now
          </button>
        </div>
      </div>
    </div>
  );
}
