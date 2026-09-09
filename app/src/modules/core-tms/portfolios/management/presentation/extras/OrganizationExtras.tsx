import { Checklist } from "../Checklist";
import { OrganizationAttachments, OrganizationFilesAfterSave } from "../../../attachments/presentation/OrganizationAttachments";
import type { ChecklistItem, OrganizationTarget } from "../../model/organization";
import css from "./extras.module.css";
export function OrganizationExtras({ target, items, pending, readOnly, onChange, canReadAttachments, canManageAttachments }: {
  target?: OrganizationTarget; items: readonly ChecklistItem[]; pending: boolean; readOnly?: boolean;
  onChange: (items: readonly ChecklistItem[]) => void | Promise<boolean>;
  canReadAttachments: boolean; canManageAttachments: boolean;
}) {
  return <div className={css.extras} data-persisted={Boolean(target)}>
    {target ? <OrganizationAttachments target={target} canRead={canReadAttachments} canManage={canManageAttachments} /> : <OrganizationFilesAfterSave />}
    <Checklist items={items} disabled={pending} readOnly={readOnly} onChange={onChange} />
  </div>;
}
