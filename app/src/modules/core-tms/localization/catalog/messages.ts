import { enDashboardLayoutMessages } from "./dashboard-layout/en";
import { ruDashboardLayoutMessages } from "./dashboard-layout/ru";
import { enActionMessages } from "./actions/en";
import { ruActionMessages } from "./actions/ru";
import { enCaseMessages } from "./cases/en";
import { ruCaseMessages } from "./cases/ru";
import { enDashboardMessages } from "./dashboard/en";
import { ruDashboardMessages } from "./dashboard/ru";
import { enDashboardWorkbenchMessages } from "./dashboard-workbench/en";
import { ruDashboardWorkbenchMessages } from "./dashboard-workbench/ru";
import { enRunMessages } from "./runs/en";
import { ruRunMessages } from "./runs/ru";
import { enShellMessages } from "./shell/en";
import { ruShellMessages } from "./shell/ru";
import { enViewMessages } from "./views/en";
import { ruViewMessages } from "./views/ru";

const enMessages = {
  ...enShellMessages,
  ...enCaseMessages,
  ...enRunMessages,
  ...enViewMessages,
  ...enDashboardMessages,
  ...enDashboardWorkbenchMessages,
  ...enDashboardLayoutMessages,
  ...enActionMessages,
} as const;

const ruMessages = {
  ...ruShellMessages,
  ...ruCaseMessages,
  ...ruRunMessages,
  ...ruViewMessages,
  ...ruDashboardMessages,
  ...ruDashboardWorkbenchMessages,
  ...ruDashboardLayoutMessages,
  ...ruActionMessages,
} satisfies Record<keyof typeof enMessages, string>;

export type TmsMessageKey = keyof typeof enMessages;

export const tmsMessages = {
  en: enMessages,
  ru: ruMessages,
} as const;
