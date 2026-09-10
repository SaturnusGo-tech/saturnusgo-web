"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FalconBrand } from "../../shared/FalconBrand";
import { companyAddress } from "../domain/company-address";
import styles from "./companyEntry.module.css";

const suffix = process.env.NEXT_PUBLIC_FALCON_COMPANY_DOMAIN_SUFFIX ?? "saturnusgo.com";

export function CompanyEntryScreen({ redirectSignup = false }: { readonly redirectSignup?: boolean }) {
  const [address, setAddress] = useState("");
  const [error, setError] = useState(false);
  const destination = companyAddress(address, suffix);
  useEffect(() => {
    if (redirectSignup) { window.location.replace("/cloud-login/"); return; }
    try { const previous = localStorage.getItem("falcon.last-company-address");
      if (previous && companyAddress(previous, suffix)) setAddress(previous);
    } catch { /* Storage is optional; company access never depends on it. */ }
  }, [redirectSignup]);
  return <main className={styles.page}>
    <header className={styles.header}><FalconBrand inverse /><Link href="/"><ArrowLeft size={16} /> На главную</Link></header>
    <section className={styles.content} aria-labelledby="company-entry-title">
      <span className={styles.caption}>FALCON</span>
      <h1 id="company-entry-title">Войти в компанию</h1>
      <p className={styles.lead}>Введите адрес, который вам передал администратор.</p>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (!destination) { setError(true); return; }
        try { localStorage.setItem("falcon.last-company-address", new URL(destination).hostname); } catch { /* optional */ }
        window.location.assign(destination);
      }}>
        <label className={styles.label} htmlFor="company-address">Адрес компании</label>
        <div className={styles.field}>
          <input id="company-address" value={address} onChange={(event) => { setAddress(event.target.value); setError(false); }}
            placeholder="umbrella" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={253}
            aria-invalid={error || undefined} aria-describedby={error ? "company-address-error" : "company-address-hint"} required />
          {!address.includes(".") && <span aria-hidden="true">-falcon.{suffix}</span>}
        </div>
        {error ? <p className={styles.error} role="alert" id="company-address-error">Проверьте адрес компании. Подойдёт короткое имя или полный адрес Falcon.</p>
          : <p className={styles.hint} id="company-address-hint">Например, umbrella или umbrella-falcon.{suffix}</p>}
        <button className={styles.submit} type="submit">Продолжить <ArrowRight size={17} aria-hidden="true" /></button>
      </form>
      <p className={styles.support}>Не знаете адрес? Обратитесь к администратору вашей компании.</p>
    </section>
  </main>;
}
