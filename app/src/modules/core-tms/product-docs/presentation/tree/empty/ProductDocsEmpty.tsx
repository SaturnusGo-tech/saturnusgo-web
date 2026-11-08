import type { ProductDocsCopy } from "../../../localization/copy";
import type { ProductDocsShelf } from "../../../state/library/useProductDocsLibrary";
import styles from "../../product-docs.module.css";

export function ProductDocsEmpty({ copy, shelf }: { copy: ProductDocsCopy; shelf: Exclude<ProductDocsShelf, "archive"> }) {
  const message = {
    overview: [copy.emptyOverviewTitle, copy.emptyOverviewDescription],
    recent: [copy.emptyRecentTitle, copy.noRecent],
    starred: [copy.emptyStarredTitle, copy.noStarred],
  }[shelf];

  return <div className={styles.libraryEmpty}>
    <img className={styles.emptyArt} src={`/falcon/product-docs/empty-${shelf}.webp`}
      alt="" width="540" height="360" decoding="async" />
    <h2>{message[0]}</h2>
    <p>{message[1]}</p>
  </div>;
}
