"use client";

import type { Element } from "hast";
import { Children, useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "./case-reference-group.module.css";

export function ProductDocCaseReferenceGroup({ children, node }: { children?: ReactNode; node?: Element }) {
  const { locale } = useTmsLocale(), ru = locale === "ru";
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const links = Children.toArray(children).filter(child => typeof child !== "string" || child.trim());
  const remaining = Math.max(0, links.length - 3);
  const label = typeof node?.properties.label === "string" ? node.properties.label : "";
  return <div className={styles.group} data-case-reference-group>
    {label && <span className={styles.label}>{label}</span>}
    <ul className={styles.list}>
      {links.slice(0, 3).map((link, index) => <li key={index}>{link}</li>)}
    </ul>
    {remaining > 0 && <>
      <div id={id} hidden={!expanded} className={styles.remainder}>
        <ul className={styles.list}>{links.slice(3).map((link, index) => <li key={index}>{link}</li>)}</ul>
      </div>
      <button type="button" className={styles.disclosure} aria-expanded={expanded} aria-controls={id}
        onClick={() => setExpanded(value => !value)}>
        <ChevronDown size={13} aria-hidden="true" />
        {expanded ? (ru ? "Свернуть" : "Show less") : (ru ? `Ещё ${remaining}` : `Show ${remaining} more`)}
      </button>
    </>}
  </div>;
}
