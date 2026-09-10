"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { AccessCopy } from "../copy/access-copy";
import type { MfaEnrollment } from "../../domain/managed-access";
import { AccessField } from "../fields/AccessField";
import styles from "../screen/access.module.css";

export function MfaForm({ copy, enrollment, enrolling, pending, onPrepare, onSubmit }: {
  readonly copy: AccessCopy; readonly enrollment: MfaEnrollment | null;
  readonly enrolling: boolean; readonly pending: boolean; readonly onPrepare: () => Promise<void>;
  readonly onSubmit: (kind: "totp" | "recovery", code: string) => Promise<void>;
}) {
  const [kind, setKind] = useState<"totp" | "recovery">("totp");
  const [code, setCode] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setQr(null);
    if (enrollment) void QRCode.toDataURL(enrollment.uri, { margin: 2, width: 368, errorCorrectionLevel: "M" })
      .then((value) => { if (active) setQr(value); }).catch(() => { /* The manual key remains available. */ });
    return () => { active = false; };
  }, [enrollment]);
  if (enrolling && !enrollment) return <button className={styles.primary} disabled={pending} onClick={() => void onPrepare()}>{copy.prepare}</button>;
  return <>
    {enrollment && <div className={styles.qr}>
      {qr && <img src={qr} alt={copy.qr} width={184} height={184} />}
      <p className={styles.company}>{copy.qrHint}</p>
      <code className={styles.secret}>{enrollment.secret}</code>
    </div>}
    <form className={styles.form} onSubmit={(event) => {
      event.preventDefault(); void onSubmit(kind, code.trim()).then(() => setCode(""));
    }}>
      <AccessField label={kind === "totp" ? copy.code : copy.recoveryCode} required autoFocus autoComplete="one-time-code"
        inputMode={kind === "totp" ? "numeric" : "text"} pattern={kind === "totp" ? "[0-9]{6}" : undefined}
        maxLength={kind === "totp" ? 6 : 64} value={code} onChange={(event) => setCode(event.target.value)} disabled={pending} />
      <button type="submit" className={styles.primary} disabled={pending}>{copy.verify}</button>
      {!enrolling && <button type="button" className={styles.linkButton} disabled={pending} onClick={() => {
        setCode(""); setKind(kind === "totp" ? "recovery" : "totp");
      }}>{kind === "totp" ? copy.useRecovery : copy.useTotp}</button>}
    </form>
  </>;
}
