"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  CORE_HOME_API_BASE,
  CORE_HOME_REGIONS,
  CORE_HOME_ROLES,
} from "../../../../constants";
import type {
  WaitlistRegion,
  WaitlistRole,
  WaitlistSubmitState,
} from "../../../../types";
import {
  buildWaitlistPayload,
  isValidWaitlistEmail,
  isValidWaitlistName,
  resolveWaitlistErrorMessage,
} from "../helpers/helpers";
import { submitWaitlist } from "../../../../services";
import styles from "../styles/styles.module.css";

export const API_BASE = CORE_HOME_API_BASE;

export default function BeFirstToTrySaturnsGo() {
  const [state, setState] = useState<WaitlistSubmitState>("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<WaitlistRole>("Traveler");
  const [region, setRegion] = useState<WaitlistRegion>("LATAM");
  const emailId = useId();
  const nameId = useId();
  const honeypotRef = useRef<HTMLInputElement>(null);

  const isValid = useMemo(
    () => isValidWaitlistEmail(email) && isValidWaitlistName(name),
    [email, name],
  );

  useEffect(() => {
    const savedEmail = window.localStorage.getItem("sg_waitlist_email");

    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (state === "loading" || !isValid) {
      return;
    }

    if (honeypotRef.current?.value) {
      setState("ok");
      setMessage("Thanks, you are in.");
      return;
    }

    setState("loading");
    setMessage("");

    try {
      const { status, ok, data } = await submitWaitlist(buildWaitlistPayload({ email, name, role, region }));

      if (status === 409) {
        window.localStorage.setItem("sg_waitlist_email", email);
        setState("ok");
        setMessage("You are already in. We will ping you when access opens.");
        return;
      }

      if (!ok) {
        throw new Error(resolveWaitlistErrorMessage(data, status));
      }

      window.localStorage.setItem("sg_waitlist_email", email);
      setState("ok");
      setMessage("You are in. Updates will arrive occasionally.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again later.");
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} aria-describedby="waitlist-note">
      <div className={styles.row}>
        <input
          id={nameId}
          className={styles.input}
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          autoComplete="name"
          aria-label="Your name"
        />
        <input
          id={emailId}
          className={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          aria-label="Email"
        />
      </div>

      <div className={styles.row}>
        <div className={styles.group}>
          <span className={styles.label}>I am</span>
          <div className={styles.chips} role="group" aria-label="I am">
            {CORE_HOME_ROLES.map((currentRole) => (
              <button
                key={currentRole}
                type="button"
                className={`${styles.chip} ${role === currentRole ? styles.chipActive : ""}`}
                aria-pressed={role === currentRole}
                onClick={() => setRole(currentRole)}
              >
                {currentRole}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.label}>Region</span>
          <div className={styles.chips} role="group" aria-label="Region">
            {CORE_HOME_REGIONS.map((currentRegion) => (
              <button
                key={currentRegion}
                type="button"
                className={`${styles.chip} ${region === currentRegion ? styles.chipActive : ""}`}
                aria-pressed={region === currentRegion}
                onClick={() => setRegion(currentRegion)}
              >
                {currentRegion}
              </button>
            ))}
          </div>
        </div>
      </div>

      <input ref={honeypotRef} tabIndex={-1} className={styles.honeypot} autoComplete="off" name="company" aria-hidden />

      <div className={styles.actions}>
        <button className={styles.submit} disabled={!isValid || state === "loading"}>
          {state === "loading" ? "Sending…" : "Get early access"}
        </button>
        <div
          id="waitlist-note"
          className={`${styles.note} ${state === "ok" ? styles.noteOk : ""} ${state === "error" ? styles.noteError : ""}`}
          aria-live="polite"
        >
          {message}
        </div>
      </div>

      <div className={styles.micro}>Signal-only launch updates. No spam.</div>
    </form>
  );
}
