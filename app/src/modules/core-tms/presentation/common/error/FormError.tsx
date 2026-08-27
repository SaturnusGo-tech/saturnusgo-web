import { XCircle } from "lucide-react";
import styles from "../../../tms.module.css";

export function FormError({ message }: { message: string }) {
  return (
    <div className={styles.formError} role="alert">
      <XCircle size={17} />
      <span>
        <strong>Could not save</strong>
        <small>{message}</small>
      </span>
    </div>
  );
}
