import { Button } from "@heroui/react";
import { IntegrationInput as Input } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import { IntegrationSwitch as Switch } from "../../../presentation/common/integration-controls/switch/IntegrationSwitch";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Copy, EyeOff, LockKeyhole } from "lucide-react";
import { DataModal as Modal } from "../shared/DataModal";
import { useTestData } from "../../application/context/TestDataContext";
import { createRevealSession } from "../../application/reveal/reveal-session";
import { watchSecretVisibility } from "../../application/reveal/reveal-lifecycle";
import type { SecretTarget } from "../../model/execution/manifest";
import { DataFeedback } from "../shared/DataFeedback";
import css from "../shared/data.module.css";
export function SecretRevealDialog({ target, ru, onClose }: { target: SecretTarget; ru: boolean; onClose(): void }) {
  const feature = useTestData();
  const session = useMemo(() => createRevealSession({ now: Date.now, schedule(callback, delay) { const timer = setTimeout(callback, delay); return () => clearTimeout(timer); } }), []);
  const state = useSyncExternalStore(session.subscribe, session.read, session.read);
  const [password, setPassword] = useState(""), [code, setCode] = useState(""), [reason, setReason] = useState(""), [recovery, setRecovery] = useState(false);
  const request = useRef<AbortController | null>(null), [copyError, setCopyError] = useState(false);
  const scope = JSON.stringify([feature?.actorId, feature?.projectId, target]);
  useEffect(() => { session.changeScope(scope); setPassword(""); setCode(""); return () => { request.current?.abort(); session.hide(); }; }, [session, scope]);
  useEffect(() => watchSecretVisibility(window, document, () => {
    request.current?.abort(); session.hide(); setPassword(""); setCode("");
  }), [session]);
  const close = () => { request.current?.abort(); session.hide(); setPassword(""); setCode(""); onClose(); };
  const unavailable = state.status === "error" && (state.errorCode === "CREDENTIAL_VERSION_CHANGED" || state.errorCode === "CREDENTIAL_DISABLED");
  return <Modal title={ru ? "Защищённое значение" : "Protected value"} subtitle={target.field} onClose={close}>
    {!feature?.permissions.reveal ? <DataFeedback denied ru={ru} /> : unavailable ? <div className={css.form}>
      <DataFeedback error={state.errorCode} ru={ru} /><div className={css.footer}><Button className={css.button} onPress={close}>{ru ? "Закрыть" : "Close"}</Button></div>
    </div> : state.status === "visible" ? <div className={css.form}>
      <p className={css.muted}>{ru ? "Значение автоматически скроется через 30 секунд. Не добавляйте его в сценарий или отчёт." : "This value hides after 30 seconds. Keep it out of scenarios and reports."}</p>
      <div className={css.reveal}><code>{state.value}</code><Button isIconOnly className={`${css.button} ${css.quiet} ${css.icon}`} aria-label={ru ? "Копировать защищённое значение" : "Copy protected value"}
        onPress={() => { void navigator.clipboard.writeText(state.value).catch(() => setCopyError(true)); }}><Copy size={15} /></Button></div>
      {copyError && <DataFeedback error ru={ru} />}
      <div className={css.footer}><Button className={css.button} startContent={<EyeOff size={14} />} onPress={close}>{ru ? "Скрыть и закрыть" : "Hide and close"}</Button></div>
    </div> : <form className={css.form} autoComplete="off" onSubmit={event => {
      event.preventDefault(); if (!feature) return;
      const controller = new AbortController(); request.current?.abort(); request.current = controller;
      const proof = { currentPassword: password, code, recovery }; setPassword(""); setCode("");
      void session.reveal(scope, () => feature.port.reveal(target, reason, proof, controller.signal));
    }}>
      <p className={css.notice}><LockKeyhole size={15} /> {ru ? "Повторно подтвердите свою учётную запись. Этот доступ фиксируется в журнале безопасности." : "Confirm your own account again. This access is recorded in the security audit."}</p>
      <Input isRequired label={ru ? "Ваш пароль" : "Your password"} labelPlacement="outside" type="password" autoComplete="current-password" value={password} onValueChange={setPassword}
        isDisabled={state.status === "pending"} classNames={{ inputWrapper: css.inputShell, input: css.input }} />
      <Input label={recovery ? (ru ? "Код восстановления" : "Recovery code") : (ru ? "Код аутентификатора, если настроен" : "Authenticator code, if configured")} labelPlacement="outside" value={code} onValueChange={setCode} autoComplete="one-time-code"
        isDisabled={state.status === "pending"} classNames={{ inputWrapper: css.inputShell, input: css.input }} />
      <Switch size="sm" color="default" isSelected={recovery} onValueChange={setRecovery} isDisabled={state.status === "pending"}>{ru ? "Использовать код восстановления" : "Use recovery code"}</Switch>
      <Input label={ru ? "Причина доступа" : "Reason for access"} labelPlacement="outside" value={reason} onValueChange={setReason} maxLength={500} isDisabled={state.status === "pending"} classNames={{ inputWrapper: css.inputShell, input: css.input }} />
      <DataFeedback error={state.status === "error" ? state.errorCode ?? true : false} ru={ru} />
      <div className={css.footer}><Button className={`${css.button} ${css.quiet}`} onPress={close}>{ru ? "Отмена" : "Cancel"}</Button>
        <Button type="submit" className={`${css.button} ${css.primary}`} isLoading={state.status === "pending"}>{ru ? "Подтвердить и показать" : "Confirm and reveal"}</Button></div>
    </form>}
  </Modal>;
}
