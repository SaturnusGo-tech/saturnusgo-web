import { PiBriefcaseDuotone } from "react-icons/pi";
import css from "./portfolio-icon.module.css";

export function PortfolioIcon({ size = 18 }: { size?: number }) {
  return <PiBriefcaseDuotone size={size} className={css.icon} aria-hidden="true" />;
}
