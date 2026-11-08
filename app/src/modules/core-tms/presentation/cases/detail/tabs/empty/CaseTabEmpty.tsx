import type { ReactNode } from "react";
import type { TmsLocale } from "../../../../../localization/model/locale";
import styles from "./case-tab-empty.module.css";

const copy = {
  attachments: {
    en: ["No attachments yet", "Screenshots, recordings, and reference files for this test case will appear here."],
    ru: ["Вложений пока нет", "Здесь будут скриншоты, записи и другие файлы этого тест-кейса."],
  },
  history: {
    en: ["No activity yet", "Changes to this test case and its linked bug reports will appear here."],
    ru: ["История пока пуста", "Здесь будут изменения тест-кейса и связанные с ним баг-репорты."],
  },
};

export function CaseTabEmpty({ kind, locale, children }: {
  kind: keyof typeof copy;
  locale: TmsLocale;
  children?: ReactNode;
}) {
  const [title, description] = copy[kind][locale];
  return <div className={styles.empty}>
    <div className={styles.content}>
      <img className={styles.illustration} src={`/falcon/cases/empty-${kind}.webp`} width={174} height={116} alt="" />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  </div>;
}
