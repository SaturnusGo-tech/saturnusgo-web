import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { portfolioCopy } from "../../../../portfolios/model/copy";
import { useProjectPortfolioName } from "../../../../projects/state/settings/useProjectPortfolioName";

export function PortfolioName({ id, offline }: { id: string | null; offline: boolean }) {
  const { locale } = useTmsLocale(); const copy = portfolioCopy(locale);
  const name = useProjectPortfolioName(id, offline);
  return <span>{!id ? copy.noPortfolio : name ?? copy.unknownPortfolio}</span>;
}
