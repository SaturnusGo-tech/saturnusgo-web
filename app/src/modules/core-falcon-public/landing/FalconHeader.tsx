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
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.primaryButton} href="/cloud-login/">
            Войти в компанию
          </Link>
        </div>
      </div>
    </header>
  );
}
