import Link from "next/link";
import { FalconBrandMark } from "../../../shared/components/brand/FalconBrandMark";
import styles from "./falconBrand.module.css";

export function FalconBrand({ inverse = false, label = "Falcon: на главную" }: { readonly inverse?: boolean; readonly label?: string }) {
  return (
    <Link className={styles.brand} href="/" aria-label={label}>
      <FalconBrandMark className={inverse ? `${styles.mark} ${styles.inverse}` : styles.mark} />
      <span>Falcon</span>
    </Link>
  );
}
