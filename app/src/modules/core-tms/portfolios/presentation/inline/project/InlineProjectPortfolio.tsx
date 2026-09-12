import { useProjectPortfolioOptions } from "../../../../projects/state/dialog/useProjectPortfolioOptions";
import { AnimatedSelect } from "../../../../presentation/common/select/AnimatedSelect";
import type { PortfolioCopy } from "../../../model/copy";
import styles from "../../styles/portfolios.module.css";
export function InlineProjectPortfolio({ workspaceId, value, name, disabled, onChange, copy }: {
 workspaceId: string; value: string | null; name?: string; disabled: boolean; onChange: (value: string | null) => void; copy: PortfolioCopy;
}) {
 const portfolios = useProjectPortfolioOptions(workspaceId, !disabled);
 const options = [{ value: "", label: copy.noPortfolio }, ...portfolios.items.map(item => ({ value: item.id, label: item.name }))];
 if (value && !portfolios.items.some(item => item.id === value)) options.push({ value, label: name ?? copy.unknownPortfolio });
 return <div className={styles.inlineChoice}><AnimatedSelect label={copy.portfolio} value={value ?? ""} options={options} disabled={disabled} onChange={value => onChange(value || null)} />
  {portfolios.error && <button type="button" className={styles.textButton} onClick={portfolios.retry}>{copy.optionsError} {copy.retry}</button>}
  {portfolios.cursor && <button type="button" className={styles.textButton} disabled={portfolios.loading} onClick={portfolios.more}>{copy.portfolioMore}</button>}
 </div>;
}
