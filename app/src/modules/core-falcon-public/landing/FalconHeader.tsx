import Link from "next/link";
import { TMS_ADMIN_LOGIN_PATH } from "../../core-tms/auth/navigation/tms-auth-route";
import { FalconBrand } from "../shared/FalconBrand";
import styles from "./landing.module.css";

export function FalconHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <FalconBrand inverse />
        <div className={styles.headerActions}>
          <Link className={styles.loginButton} href={TMS_ADMIN_LOGIN_PATH}>Войти</Link>
          <Link className={styles.primaryButton} href="/signup/">Попробовать</Link>
        </div>
      </div>
    </header>
  );
}
