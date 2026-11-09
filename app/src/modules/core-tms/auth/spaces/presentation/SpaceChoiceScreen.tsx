"use client";
import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import type { useSpaceChoice } from "../application/useSpaceChoice";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { workspaceDisplayName } from "../../../localization/format/workspace/display-name";
import { spaceChoiceCopy } from "./space-choice-copy";
import access from "../../managed/presentation/screen/access.module.css";
import styles from "./spaces.module.css";
export function SpaceChoiceScreen({ model }: { readonly model: ReturnType<typeof useSpaceChoice> }) {
  const { locale, setLocale } = useTmsLocale();
  const copy = spaceChoiceCopy(locale), { state } = model;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (!state.loading) heading.current?.focus({ preventScroll: true }); }, [state.loading, state.error]);
  const expired = state.error === "SPACE_PROOF_INVALID", denied = state.error === "SPACE_SELECTION_INVALID";
  return <main className={access.page} lang={locale}>
    <header className={access.header}><div className={access.language} aria-label={locale === "ru" ? "Язык" : "Language"}>
      <button onClick={() => setLocale("ru")} aria-pressed={locale === "ru"}>RU</button><button onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button>
    </div></header>
    <section className={access.content} aria-busy={state.loading || !!state.pending || state.cancelling}>
      <a href="/" className={access.brand} aria-label="Falcon"><span className={access.brandMark} aria-hidden="true" /></a>
      <h1 ref={heading} tabIndex={-1}>{copy.title}</h1>
      {state.destination ? <p className={access.lead} role="status">{state.destination === "/cloud-login/" ? copy.returning : copy.opening}</p> : state.loading ? <div className={access.loading} role="status" aria-label={copy.loading}><LoadingOrb size="lg" /></div>
        : state.cancelling ? <p className={access.lead} role="status">{copy.returning}</p>
          : state.error ? <><p className={access.error} role="alert">{expired ? copy.expired : denied ? copy.unavailable : copy.error}</p>
            {!expired && !denied && <button className={access.secondary} onClick={model.retry}>{copy.retry}</button>}</>
            : state.spaces?.length ? <div className={styles.choices}>{state.spaces.map(space => <button key={space.id} className={styles.choice}
              disabled={!!state.pending} aria-busy={state.pending === space.id} onClick={() => void model.select(space.id)}>
              <span><strong>{workspaceDisplayName(space, locale)}</strong><small>{space.kind === "company" ? copy.company : copy.personal}</small></span>
              {state.pending === space.id ? <LoadingOrb /> : <ChevronRight size={18} aria-hidden="true" />}
            </button>)}</div> : <p className={access.lead} role="status">{copy.empty}</p>}
      <footer className={access.footer}><button className={access.linkButton} disabled={state.cancelling} onClick={() => void model.cancel()}>{copy.back}</button></footer>
    </section>
  </main>;
}
