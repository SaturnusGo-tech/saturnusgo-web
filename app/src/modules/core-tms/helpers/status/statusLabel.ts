import type { ExecutionStatus } from "../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../localization/format/labels";
import type { TmsLocale } from "../../localization/model/locale";

export const statusLabel = (locale: TmsLocale, status: ExecutionStatus) =>
  localizedLabel(locale, status);
