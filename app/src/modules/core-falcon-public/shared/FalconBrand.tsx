import Image from "next/image";
import Link from "next/link";
import styles from "./falconBrand.module.css";

export function FalconBrand({ inverse = false }: { readonly inverse?: boolean }) {
  return (
    <Link className={styles.brand} href="/" aria-label="Falcon — на главную">
      <Image
        src={inverse ? "/falcon/falcon-mark-light.png" : "/falcon/falcon-mark-dark.png"}
        alt=""
        width={40}
        height={40}
        className={styles.mark}
        priority
      />
      <span>Falcon</span>
    </Link>
  );
}
