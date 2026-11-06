import { CircleCheck } from "lucide-react";
import css from "../../startup.module.css";
export function CompanyProgressOrb({ ready = false }: { ready?: boolean }) {
  return <div className={css.orb} data-ready={ready} aria-hidden="true"><div className={css.orbRing} /><i /><i /><i /></div>;
}
export function CompanyProgressStep({ name, ru, kind, busy, canContinue, onContinue, onRefresh }: { name: string; ru: boolean; kind: "loading" | "preparing" | "finishing" | "opening" | "success" | "failed"; busy: boolean; canContinue?: boolean; onContinue?(): void; onRefresh?(): void }) {
  const success = kind === "success";
  const label = kind === "loading" ? (ru ? "Загружаем данные…" : "Loading your details…") : kind === "preparing" ? (ru ? "Готовим компанию. Ещё немного." : "Preparing your company. Just a moment.") : kind === "finishing" ? (ru ? "Завершаем настройку…" : "Finishing up…") : kind === "opening" ? (ru ? "Открываем вашу компанию…" : "Opening your company…") : kind === "failed" ? (ru ? "Не удалось подготовить компанию" : "We couldn’t prepare your company") : "";
  return <div className={css.progress} role="status" aria-live="polite">
    <CompanyProgressOrb ready={success || canContinue} />
    {!success && <h1>{canContinue ? (ru ? "Адрес компании готов" : "Your company address is ready") : label}</h1>}
    <p className={css.companyName}>{name}</p>
    {success && <p className={css.success}><CircleCheck size={24} />{ru ? "Ваша компания готова" : "Your company is ready"}</p>}
    {(success || canContinue) && <button type="button" className={css.primary} disabled={busy} onClick={onContinue}>{ru ? "Продолжить" : "Continue"}</button>}
    {kind === "finishing" && onRefresh && <button type="button" className={css.subtleLink} disabled={busy} onClick={onRefresh}>{ru ? "Проверить статус" : "Check status"}</button>}
  </div>;
}
