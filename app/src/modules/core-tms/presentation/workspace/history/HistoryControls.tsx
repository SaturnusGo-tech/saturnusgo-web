import { ArrowLeft, ArrowRight } from "@openai/apps-sdk-ui/components/Icon";
import { useEffect, useState } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { HISTORY_CHANGE, workspaceHistoryPosition } from "../../../state/navigation/browser/workspace-history";
import styles from "./history.module.css";
export function HistoryControls() {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const [position, setPosition] = useState({ back: false, forward: false });
  useEffect(() => {
    const update = () => setPosition(workspaceHistoryPosition());
    update(); window.addEventListener("popstate", update); window.addEventListener(HISTORY_CHANGE, update);
    return () => { window.removeEventListener("popstate", update); window.removeEventListener(HISTORY_CHANGE, update); };
  }, []);
  return <nav className={styles.controls} aria-label={ru ? "История экранов" : "Page history"}>
    <button type="button" aria-label={ru ? "Назад" : "Go back"} title={ru ? "Назад" : "Go back"} disabled={!position.back} onClick={() => window.history.back()}><ArrowLeft width={20} height={20} aria-hidden="true" /></button>
    <button type="button" aria-label={ru ? "Вперёд" : "Go forward"} title={ru ? "Вперёд" : "Go forward"} disabled={!position.forward} onClick={() => window.history.forward()}><ArrowRight width={20} height={20} aria-hidden="true" /></button>
  </nav>;
}
