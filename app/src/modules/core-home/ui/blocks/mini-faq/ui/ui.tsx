"use client";

import { useEffect, useMemo, useState } from "react";

import { CORE_HOME_FAQ_ITEMS } from "../../../../constants";
import type { CoreHomeFaqItem } from "../../../../types";
import styles from "../styles/styles.module.css";

type MiniFaqProps = {
  items?: CoreHomeFaqItem[];
};

export default function MiniFAQ({ items }: MiniFaqProps) {
  const questions = useMemo(() => (items?.length ? items : CORE_HOME_FAQ_ITEMS), [items]);
  const [openId, setOpenId] = useState<string>(questions[0]?.id ?? "");

  useEffect(() => {
    const currentHash = window.location.hash.replace("#faq-", "");

    if (questions.some((item) => item.id === currentHash)) {
      setOpenId(currentHash);
    }
  }, [questions]);

  return (
    <div className={styles.list} aria-label="Frequently asked questions">
      {questions.map((item) => {
        const isOpen = item.id === openId;
        const panelId = `faq-panel-${item.id}`;
        const buttonId = `faq-${item.id}`;

        return (
          <article className={styles.item} data-open={isOpen} key={item.id}>
            <button
              id={buttonId}
              className={styles.button}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenId(isOpen ? "" : item.id)}
            >
              <span className={styles.question}>{item.question}</span>
              <span className={styles.icon} aria-hidden>{isOpen ? "−" : "+"}</span>
            </button>

            {isOpen ? (
              <div id={panelId} className={styles.answer} role="region" aria-labelledby={buttonId}>
                {item.answer}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
