"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import type { ComponentProps } from "react";
import styles from "../screen/access.module.css";

export function AccessField({ label, revealLabel, hint, ...input }: ComponentProps<"input"> & { label: string; revealLabel?: string; hint?: string }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const password = input.type === "password";
  return <label className={styles.field} htmlFor={id}>
    <span>{label}</span>
    <div className={styles.inputWrap}>
      <input {...input} id={id} aria-describedby={hint ? `${id}-hint` : input["aria-describedby"]} type={password && visible ? "text" : input.type} />
      {password && <button type="button" aria-label={revealLabel} aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
    </div>
    {hint && <small id={`${id}-hint`} className={styles.fieldHint}>{hint}</small>}
  </label>;
}
