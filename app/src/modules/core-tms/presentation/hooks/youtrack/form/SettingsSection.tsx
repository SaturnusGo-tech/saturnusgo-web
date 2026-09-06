import type { ReactNode } from "react";

import surface from "../../hooks.module.css";

export function SettingsSection({ title, description, children }: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={surface.settingsSection}>
      <header>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className={surface.sectionBody}>{children}</div>
    </section>
  );
}
