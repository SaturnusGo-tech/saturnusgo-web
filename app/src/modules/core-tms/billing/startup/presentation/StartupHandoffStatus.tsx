import type { useWorkspaceHandoff } from "../../../auth/workspace-handoff/application/useWorkspaceHandoff";
export function StartupHandoffStatus({state,ru}:{state:ReturnType<typeof useWorkspaceHandoff>;ru:boolean}) {
  if((state.phase==="idle"||state.phase==="complete"))return null;
  return <div role={state.phase==="error"?"alert":"status"} aria-live="polite">
    <p>{state.phase==="error"?(ru?"Адрес компании пока не удалось открыть. Оплаченный доступ сохраняется здесь.":"Could not open the company address yet. Your paid access remains available here.")
      :(ru?"Открываем адрес компании…":"Opening your company address…")}</p>
    {state.phase!=="loading"&&<button type="button" onClick={state.retry}>{ru?"Повторить переход":"Try opening again"}</button>}
  </div>;
}
