"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import type { AccessCopy } from "../copy/access-copy";
import { AccessField } from "../fields/AccessField";
import styles from "../screen/access.module.css";

export function LoginForm({ copy, pending, onSubmit }: {
  readonly copy: AccessCopy; readonly pending: boolean;
  readonly onSubmit: (login: string, password: string) => Promise<void>;
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  return <form className={styles.form} onSubmit={(event) => {
    event.preventDefault(); void onSubmit(login.trim(), password).then(() => setPassword(""));
  }}>
    <AccessField label={copy.login} name="username" autoComplete="username" required autoFocus
      value={login} onChange={(event) => setLogin(event.target.value)} disabled={pending} maxLength={254} />
    <AccessField label={copy.password} name="password" type="password" revealLabel={copy.showPassword}
      autoComplete="current-password" required value={password} disabled={pending}
      onChange={(event) => setPassword(event.target.value)} maxLength={256} />
    <button className={styles.primary} type="submit" disabled={pending}>
      {copy.signIn}{pending ? <LoaderCircle size={17} className={styles.spinner} /> : <ArrowRight size={17} />}
    </button>
  </form>;
}
