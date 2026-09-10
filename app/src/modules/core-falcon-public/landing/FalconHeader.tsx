import Link from "next/link";
import { FalconBrand } from "../shared/FalconBrand";
import styles from "./landing.module.css";

export function FalconHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <FalconBrand inverse />
        <nav className={styles.headerNav} aria-label="Навигация по лендингу">
          <a href="#product">Продукт</a>
          <a href="#integrations">Интеграции</a>
          <a href="#pilot">Пилот</a>
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.loginButton} href="/cloud-login/">
            Войти
          </Link>
          <a className={styles.primaryButton} href="#pilot">Обсудить пилот</a>
        </div>
      </div>
    </header>
  );
}
