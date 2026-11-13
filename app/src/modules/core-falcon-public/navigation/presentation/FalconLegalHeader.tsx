"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { FalconBrandMark } from "../../../../shared/components/brand/FalconBrandMark";
import { usePublicReturnNavigation } from "../browser/usePublicReturnNavigation";
import styles from "../../privacy/privacy.module.css";

const copy = {
  en: { back: "Back", home: "Falcon home", workspace: "Back to workspace" },
  ru: { back: "Назад", home: "Главная Falcon", workspace: "Вернуться в рабочее пространство" },
  es: { back: "Volver", home: "Inicio de Falcon", workspace: "Volver al espacio de trabajo" },
  pt: { back: "Voltar", home: "Página inicial do Falcon", workspace: "Voltar ao espaço de trabalho" },
};

type Props = { locale: keyof typeof copy; languageLabel: string; browserHome: string; browserBack?: string; children: ReactNode };

export function FalconLegalHeader({ locale, languageLabel, browserHome, browserBack, children }: Props) {
  const navigation = usePublicReturnNavigation(browserHome, browserBack);
  const labels = copy[locale];
  return <header className={styles.header}>
    <div className={styles.headerNavigation}>
      <a className={styles.brand} href={navigation.homeHref} aria-label={navigation.desktop ? labels.workspace : labels.home}>
        <FalconBrandMark className={styles.brandMark} />
        falcon<span className={styles.brandArrow} aria-hidden="true">↗</span>
      </a>
      <a className={styles.back} href={navigation.backHref}><ArrowLeft size={16} aria-hidden="true" />{labels.back}</a>
    </div>
    <nav className={styles.languages} aria-label={languageLabel}>{children}</nav>
  </header>;
}
