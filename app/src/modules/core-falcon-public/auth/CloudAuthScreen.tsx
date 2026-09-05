"use client";

import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { TMS_ADMIN_LOGIN_PATH } from "../../core-tms/auth/navigation/tms-auth-route";
import { FalconBrand } from "../shared/FalconBrand";
import {
  CloudAuthError, cloudWorkspacePath, loginCloudAccount, registerCloudAccount,
} from "../../core-tms/auth/cloud/cloud-auth-client";
import styles from "./cloudAuth.module.css";

type Mode = "register" | "login";
type AccountType = "personal" | "organization";
type Fields = { givenName: string; familyName: string; email: string; phone: string; password: string; confirm: string; consent: boolean; companyName: string; inn: string };
const initial: Fields = { givenName: "", familyName: "", email: "", phone: "", password: "", confirm: "", consent: false, companyName: "", inn: "" };

export function CloudAuthScreen({ mode }: { readonly mode: Mode }) {
  const [fields, setFields] = useState(initial);
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState("");
  const registrationOperation = useRef<{ readonly fingerprint: string; readonly key: string } | null>(null);

  useEffect(() => {
    setFields(initial);
    setAccountType("personal");
    setError("");
    setStatus("idle");
    registrationOperation.current = null;
  }, [mode]);

  const update = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((current) => ({ ...current, [key]: value }));
    setError("");
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "register" && accountType === "organization") return;
    if (mode === "register" && fields.password !== fields.confirm) {
      setError("Пароли не совпадают."); return;
    }
    if (mode === "register" && !fields.consent) {
      setError("Подтвердите согласие с условиями использования."); return;
    }
    setStatus("loading"); setError("");
    try {
      const registration = {
          givenName: fields.givenName.trim(), familyName: fields.familyName.trim(),
          email: fields.email.trim(), phone: fields.phone.trim(), password: fields.password,
          termsAccepted: true,
        } as const;
      const fingerprint = JSON.stringify(registration);
      if (mode === "register" && registrationOperation.current?.fingerprint !== fingerprint) {
        registrationOperation.current = {
          fingerprint,
          key: typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `signup-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        };
      }
      const session = mode === "register"
        ? await registerCloudAccount(registration, registrationOperation.current!.key)
        : await loginCloudAccount(fields.email.trim(), fields.password);
      setStatus("success");
      window.setTimeout(() => window.location.assign(cloudWorkspacePath(session)), 650);
    } catch (cause) {
      const fallback = mode === "register"
        ? "Не удалось создать пространство. Проверьте данные и повторите попытку."
        : "Не удалось войти. Проверьте почту и пароль.";
      setError(cause instanceof CloudAuthError ? localizeError(cause, mode) : fallback);
      setStatus("idle");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <FalconBrand />
        <Link href="/"><ArrowLeft size={17} /> На главную</Link>
      </header>
      <div className={styles.shell}>
        <section className={styles.contextPanel} aria-label="О Falcon Cloud">
          <div>
            <p className={styles.eyebrow}>FALCON CLOUD</p>
            <h1>{mode === "register" ? accountType === "personal" ? "Ваше пространство для управления качеством" : "Falcon для вашей организации" : "С возвращением в Falcon"}</h1>
            <p>{mode === "register" ? accountType === "personal" ? "Создайте личное рабочее пространство. Проекты и данные будут доступны только вам и приглашённым участникам." : "Организационные аккаунты проходят ручную проверку. Мы показываем будущий состав заявки честно и пока не отправляем документы." : "Продолжите работу с кейсами, ранами и аналитикой своего пространства."}</p>
          </div>
          <ul>
            <li><ShieldCheck size={19} /><span><strong>Изолированные данные</strong>Отдельное пространство и проекты</span></li>
            <li><LockKeyhole size={19} /><span><strong>Защищённый вход</strong>Данные сессии не отображаются в интерфейсе</span></li>
          </ul>
        </section>

        <section className={styles.formCard} aria-labelledby="cloud-auth-title">
          <p className={styles.step}>{mode === "register" ? "НОВОЕ ПРОСТРАНСТВО" : "ВХОД В ОБЛАКО"}</p>
          <h2 id="cloud-auth-title">{mode === "register" ? "Создать аккаунт" : "Войти в аккаунт"}</h2>
          <p className={styles.formLead}>{mode === "register" ? "Заполните данные владельца пространства." : "Используйте данные, указанные при регистрации."}</p>
          {mode === "register" && (
            <div className={styles.accountType} role="group" aria-label="Тип пространства">
              <button type="button" aria-pressed={accountType === "personal"} data-active={accountType === "personal"} onClick={() => setAccountType("personal")}>Личное</button>
              <button type="button" aria-pressed={accountType === "organization"} data-active={accountType === "organization"} onClick={() => setAccountType("organization")}>Организация <small>скоро</small></button>
            </div>
          )}
          <form onSubmit={submit}>
            {mode === "register" && accountType === "organization" && (
              <>
                <Field label="Название компании" autoComplete="organization" value={fields.companyName} onChange={(value) => update("companyName", value)} required />
                <Field label="ИНН" inputMode="numeric" value={fields.inn} onChange={(value) => update("inn", value.replace(/\D/g, "").slice(0, 12))} required />
              </>
            )}
            {mode === "register" && (
              <div className={styles.nameGrid}>
                <Field label={accountType === "organization" ? "Имя контакта" : "Имя"} autoComplete="given-name" value={fields.givenName} onChange={(value) => update("givenName", value)} required />
                <Field label={accountType === "organization" ? "Фамилия контакта" : "Фамилия"} autoComplete="family-name" value={fields.familyName} onChange={(value) => update("familyName", value)} required />
              </div>
            )}
            <Field label={accountType === "organization" && mode === "register" ? "Корпоративный email" : "Email"} type="email" autoComplete="email" value={fields.email} onChange={(value) => update("email", value)} required />
            {mode === "register" && <Field label="Телефон" type="tel" autoComplete="tel" placeholder="+7 999 000-00-00" value={fields.phone} onChange={(value) => update("phone", value)} required />}
            {(mode === "login" || accountType === "personal") && <PasswordField label="Пароль" autoComplete={mode === "register" ? "new-password" : "current-password"} value={fields.password} visible={visible} onVisibility={() => setVisible((value) => !value)} onChange={(value) => update("password", value)} />}
            {mode === "register" && accountType === "personal" && <PasswordField label="Повторите пароль" autoComplete="new-password" value={fields.confirm} visible={visible} onVisibility={() => setVisible((value) => !value)} onChange={(value) => update("confirm", value)} />}
            {mode === "register" && accountType === "personal" && <p className={styles.passwordHint}>Не менее 12 символов.</p>}
            {mode === "register" && accountType === "personal" && (
              <label className={styles.consent}>
                <input type="checkbox" checked={fields.consent} onChange={(event) => update("consent", event.target.checked)} />
                <span aria-hidden="true"><Check size={13} /></span>
                <span className={styles.consentText}>Я принимаю <a href="https://www.saturnusgo.com/partners/terms/" target="_blank" rel="noopener noreferrer">условия использования</a> и <a href="https://www.saturnusgo.com/partners/privacy/" target="_blank" rel="noopener noreferrer">обработки персональных данных</a>.</span>
              </label>
            )}
            {mode === "register" && accountType === "organization" && (
              <p className={styles.organizationNotice}>Регистрация организаций откроется после запуска ручной проверки реквизитов и защищённой загрузки документов. Сейчас заявка не отправляется.</p>
            )}
            {error && <p className={styles.error} role="alert">{error}</p>}
            <button className={styles.submit} type="submit" disabled={status !== "idle" || (mode === "register" && accountType === "organization")}>
              {status === "loading" ? <><LoaderCircle className={styles.loadingIcon} size={18} aria-hidden="true" /> Подождите…</> : status === "success" ? <><Check size={18} /> Готово, открываем Falcon</> : mode === "register" && accountType === "organization" ? "Регистрация организаций — скоро" : <>{mode === "register" ? "Создать пространство" : "Войти"}<ArrowRight size={18} /></>}
            </button>
          </form>
          <p className={styles.switchMode}>
            {mode === "register" ? "Уже зарегистрированы?" : "Ещё нет пространства?"}{" "}
            <Link href={mode === "register" ? "/cloud-login/" : "/signup/"}>{mode === "register" ? "Войти в облако" : "Создать аккаунт"}</Link>
          </p>
          <div className={styles.adminEntry}>
            <span>Корпоративная админка</span>
            <Link href={TMS_ADMIN_LOGIN_PATH}>Войти через OAuth</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field(props: { readonly label: string; readonly value: string; readonly onChange: (value: string) => void; readonly type?: string; readonly autoComplete?: string; readonly placeholder?: string; readonly required?: boolean; readonly inputMode?: "numeric" }) {
  return <label className={styles.field}><span>{props.label}</span><input type={props.type ?? "text"} value={props.value} onChange={(event) => props.onChange(event.target.value)} autoComplete={props.autoComplete} placeholder={props.placeholder} required={props.required} inputMode={props.inputMode} /></label>;
}

function PasswordField(props: { readonly label: string; readonly value: string; readonly visible: boolean; readonly onVisibility: () => void; readonly onChange: (value: string) => void; readonly autoComplete: string }) {
  return <label className={styles.field}><span>{props.label}</span><div className={styles.password}><input type={props.visible ? "text" : "password"} value={props.value} onChange={(event) => props.onChange(event.target.value)} autoComplete={props.autoComplete} minLength={12} maxLength={128} required /><button type="button" onClick={props.onVisibility} aria-label={props.visible ? "Скрыть пароль" : "Показать пароль"}>{props.visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>;
}

function localizeError(error: CloudAuthError, mode: Mode): string {
  if (error.status === 409) return "Аккаунт с этой почтой уже существует. Войдите в облако.";
  if (error.status === 401) return "Неверная почта или пароль.";
  if (error.status === 429) return "Слишком много попыток. Подождите немного и попробуйте снова.";
  if (error.status === 400 || error.status === 422) return "Проверьте заполненные данные и повторите попытку.";
  return mode === "register" ? "Сейчас не удалось создать пространство. Повторите попытку." : "Сейчас не удалось войти. Повторите попытку.";
}
