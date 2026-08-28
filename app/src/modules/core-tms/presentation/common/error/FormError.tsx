import { XCircle } from "lucide-react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import styles from "../../../tms.module.css";

export function FormError({ message }: { message: string }) {
  const { t } = useTmsLocale();
  return (
    <div className={styles.formError} role="alert">
      <XCircle size={17} />
      <span>
        <strong>{t("form.couldNotSave")}</strong>
        <small>{message}</small>
      </span>
    </div>
  );
}
