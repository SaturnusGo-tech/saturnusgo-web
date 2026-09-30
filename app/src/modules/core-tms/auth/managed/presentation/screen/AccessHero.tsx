import type { AccessCopy } from "../copy/access-copy";
import styles from "./access.module.css";

export function AccessHero({ copy, passwordChange }: { readonly copy: AccessCopy; readonly passwordChange: boolean }) {
  return <aside className={styles.hero}>
    <img className={styles.heroArtwork} src="/falcon/auth/silver-wing.webp" alt="" width={1151} height={1367} fetchPriority="high" />
    <div className={styles.heroIntro}>
      <p className={styles.heroEyebrow}>FALCON</p>
      <h2>{passwordChange ? copy.passwordHeroTitle : copy.heroTitle}</h2>
      <p>{passwordChange ? copy.passwordHeroBody : copy.heroBody}</p>
      <p>{passwordChange ? copy.passwordHeroDetail : copy.heroDetail}</p>
    </div>
    <div className={styles.heroStatement}>
      <p>{passwordChange ? copy.passwordHeroStatement : copy.heroStatement}</p>
      <span>{copy.heroCaption}</span>
    </div>
  </aside>;
}
