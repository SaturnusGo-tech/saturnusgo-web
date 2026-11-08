"use client";

import { useState } from "react";
import styles from "../../product-docs.module.css";

export function ProductDocsMark() {
  const [imageReady, setImageReady] = useState(false);
  return <span className={styles.libraryMark} data-ready={imageReady || undefined} aria-hidden="true">
    <svg viewBox="0 0 32 32" width="26" height="26" fill="none">
      <path d="M16 26.4c-2.9-1.8-6.7-2.2-11-1.8V17m11 9.4c2.9-1.8 6.7-2.2 11-1.8V17M16 26.4v-5.5"
        stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m16 16.5-3.9-4.7L3 7l3.2 6.8 3.9 2.6 3.1 4.2L16 22l2.8-1.4 3.1-4.2 3.9-2.6L29 7l-9.1 4.8-3.9 4.7Z"
        stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m5.4 11.8 7.1 3.6m-3.9-.1 5.5 3.3m12.5-6.8-7.1 3.6m3.9-.1-5.5 3.3"
        stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
    </svg>
    <img src="/falcon/product-docs/mark.webp" width="26" height="26" alt="" onLoad={() => setImageReady(true)} />
  </span>;
}
