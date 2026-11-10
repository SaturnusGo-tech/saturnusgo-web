import { supportCopy, supportEmail, type SupportLocale } from "./copy";
import { FalconSupportFormClient } from "./FalconSupportFormClient";
import styles from "./support.module.css";

export function FalconSupportPage({ locale }: { locale: SupportLocale }) {
  const copy = supportCopy[locale];

  return (
    <main className={styles.page} lang={locale} aria-labelledby="falcon-support-title">
      <div className={styles.layout}>
        <section className={styles.intro}>
          <h1 id="falcon-support-title">{copy.title}</h1>
          <ul className={styles.topics}>
            {copy.topics.map(topic => (
              <li key={topic}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {topic}
              </li>
            ))}
          </ul>
          <p className={styles.directEmail}>
            {copy.directEmail} <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          </p>
        </section>
        <section className={styles.formSection} aria-labelledby="falcon-support-form-title">
          <h2 id="falcon-support-form-title">{copy.formTitle}</h2>
          <p id="falcon-support-message-hint" className={styles.formHint}>{copy.formHint}</p>
          <FalconSupportFormClient locale={locale} />
        </section>
      </div>
    </main>
  );
}
