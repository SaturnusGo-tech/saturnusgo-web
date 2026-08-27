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
import type { View } from "../../state/types/workspace";
import styles from "../../tms.module.css";

const navigationItems: Array<{
  id: View;
  label: string;
  icon: ReactNode;
}> = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { id: "cases", label: "Test cases", icon: <FolderKanban size={20} /> },
  {
    id: "integrations",
    label: "Integration testing",
    icon: <Network size={20} />,
  },
  { id: "runs", label: "Test runs", icon: <PlayCircle size={20} /> },
  { id: "suites", label: "Suites", icon: <ListChecks size={20} /> },
  { id: "hooks", label: "Hooks", icon: <Link2 size={20} /> },
  { id: "reports", label: "Reports", icon: <FileBarChart size={20} /> },
  { id: "config", label: "Config", icon: <Settings size={20} /> },
];

export function Navigation({
  view,
  onChange,
  disabled,
}: {
  view: View;
  onChange: (view: View) => void;
  disabled: boolean;
}) {
  return (
    <nav className={styles.navigation} aria-label="TMS sections">
      {navigationItems.map((item) => (
        <button
          key={item.id}
          className={`${styles.navigationItem} ${
            !disabled && view === item.id ? styles.navigationItemActive : ""
          }`}
          onClick={() => onChange(item.id)}
          disabled={disabled}
          aria-label={item.label}
          aria-current={!disabled && view === item.id ? "page" : undefined}
          title={item.label}
          data-testid={`nav-${item.id}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
