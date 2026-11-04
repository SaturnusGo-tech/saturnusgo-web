"use client";
import { useEffect, useState } from "react";
import type { SelfProfile, SelfProfileDetails } from "../../domain/profile-model";
import { profileCopy } from "../copy/profile-copy";
import styles from "./profile-editor.module.css";

export function ProfileEditor({ profile, pending, ru, onSave }: {
  profile: SelfProfile; pending: boolean; ru: boolean; onSave: (details: SelfProfileDetails) => Promise<boolean>;
}) {
  const copy = profileCopy(ru);
  const [name, setName] = useState(profile.name), [phone, setPhone] = useState(profile.phone ?? "");
  const [introduction, setIntroduction] = useState(profile.introduction ?? ""), [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? ""), [contactUrl, setContactUrl] = useState(profile.contactUrl ?? "");
  useEffect(() => {
    setName(profile.name); setPhone(profile.phone ?? ""); setIntroduction(profile.introduction ?? "");
    setBio(profile.bio ?? ""); setLocation(profile.location ?? ""); setContactUrl(profile.contactUrl ?? "");
  }, [profile.id, profile.name, profile.phone, profile.introduction, profile.bio, profile.location, profile.contactUrl]);
  const dirty = name !== profile.name || phone !== (profile.phone ?? "") || introduction !== (profile.introduction ?? "")
    || bio !== (profile.bio ?? "") || location !== (profile.location ?? "") || contactUrl !== (profile.contactUrl ?? "");
  return <form className={styles.form} aria-label={copy.details} onSubmit={event => {
    event.preventDefault(); if (!dirty || pending) return;
    void onSave({ name: name.trim(), phone: phone.trim(), introduction: introduction.trim(), bio: bio.trim(), location: location.trim(), contactUrl: contactUrl.trim() || null });
  }}>
    <h2>{copy.details}</h2>
    <label className={styles.field}><span>{copy.name}</span><input value={name} onChange={event => setName(event.target.value)} required maxLength={200} autoComplete="name" disabled={pending} /></label>
    <label className={styles.field}><span>{copy.introduction}</span><small>{copy.introductionHint}</small>
      <textarea rows={2} value={introduction} onChange={event => setIntroduction(event.target.value)} maxLength={160} disabled={pending} />
      <span className={styles.counter}>{introduction.length} / 160</span>
    </label>
    <label className={styles.field}><span>{copy.bio}</span><small>{copy.bioHint}</small>
      <textarea className={styles.bio} rows={5} value={bio} onChange={event => setBio(event.target.value)} maxLength={2000} disabled={pending} />
    </label>
    <div className={styles.pair}>
      <label className={styles.field}><span>{copy.location}</span><input value={location} onChange={event => setLocation(event.target.value)} maxLength={120} autoComplete="address-level2" disabled={pending} /></label>
      <label className={styles.field}><span>{copy.phone}</span><input type="tel" value={phone} onChange={event => setPhone(event.target.value)} pattern={String.raw`(?:|\+?[0-9 \(\)\-]{7,32})`} maxLength={32} autoComplete="tel" disabled={pending} /></label>
    </div>
    <label className={styles.field}><span>{copy.contact}</span><input value={contactUrl} onChange={event => setContactUrl(event.target.value)} placeholder="https://" pattern="https://.*|mailto:.*|" maxLength={2048} disabled={pending} /><small>{copy.contactHint}</small></label>
    <div className={styles.email}><span>{copy.email}</span><span>{profile.email}</span></div>
    <footer><button type="submit" disabled={pending || !dirty || !name.trim()}>{pending ? copy.saving : copy.save}</button></footer>
  </form>;
}
