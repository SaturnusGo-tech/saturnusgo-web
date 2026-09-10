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
          <a href="#contact">Контакты</a>
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.loginButton} href="/cloud-login/">
            Войти
          </Link>
          <a className={styles.primaryButton} href="#contact">Связаться с нами</a>
        </div>
      </div>
    </header>
  );
}
