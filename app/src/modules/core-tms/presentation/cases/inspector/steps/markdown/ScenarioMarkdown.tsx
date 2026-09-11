"use client";

import { MarkdownField } from "../../markdown/MarkdownField";
import css from "./scenarioMarkdown.module.css";

export function ScenarioMarkdown({ value, label }: { value: string; label: string }) {
  return <div className={css.rendered}><MarkdownField value={value} label={label} allowAttachments={false} /></div>;
}
