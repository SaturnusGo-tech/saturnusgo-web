import { enActionMessages } from "./actions/en";
import { ruActionMessages } from "./actions/ru";
import { enCaseMessages } from "./cases/en";
import { ruCaseMessages } from "./cases/ru";
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
  ...enActionMessages,
} as const;

const ruMessages = {
  ...ruShellMessages,
  ...ruCaseMessages,
  ...ruRunMessages,
  ...ruViewMessages,
  ...ruActionMessages,
} satisfies Record<keyof typeof enMessages, string>;

export type TmsMessageKey = keyof typeof enMessages;

export const tmsMessages = {
  en: enMessages,
  ru: ruMessages,
} as const;
