import {
  FileBarChart,
  FolderKanban,
  LayoutDashboard,
  Link2,
  ListChecks,
  Network,
  PlayCircle,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import type { TmsMessageKey } from "../../localization/catalog/messages";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { View } from "../../state/types/workspace";
import styles from "../../tms.module.css";

const navigationItems: Array<{
  id: View;
  labelKey: TmsMessageKey;
  icon: ReactNode;
}> = [
  { id: "dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard size={20} /> },
  { id: "cases", labelKey: "nav.cases", icon: <FolderKanban size={20} /> },
  {
    id: "integrations",
    labelKey: "nav.integrations",
    icon: <Network size={20} />,
  },
  { id: "runs", labelKey: "nav.runs", icon: <PlayCircle size={20} /> },
  { id: "suites", labelKey: "nav.suites", icon: <ListChecks size={20} /> },
  { id: "hooks", labelKey: "nav.hooks", icon: <Link2 size={20} /> },
  { id: "reports", labelKey: "nav.reports", icon: <FileBarChart size={20} /> },
  { id: "config", labelKey: "nav.config", icon: <Settings size={20} /> },
];

export function Navigation({
  view,
  onChange,
  disabled,
  collapsed,
}: {
  view: View;
  onChange: (view: View) => void;
  disabled: boolean;
  collapsed: boolean;
}) {
  const { t } = useTmsLocale();
  return (
    <nav
      id="tms-navigation"
      className={`${styles.navigation} ${collapsed ? styles.navigationCollapsed : ""}`}
      aria-label={t("nav.ariaLabel")}
    >
      {navigationItems.map((item) => {
        const label = t(item.labelKey);
        return (
          <button
            key={item.id}
            className={`${styles.navigationItem} ${
              !disabled && view === item.id ? styles.navigationItemActive : ""
            }`}
            onClick={() => onChange(item.id)}
            disabled={disabled}
            aria-label={label}
            aria-current={!disabled && view === item.id ? "page" : undefined}
            title={label}
            data-testid={`nav-${item.id}`}
          >
            {item.icon}
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
