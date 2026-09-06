import { Unplug } from "lucide-react";

import { Modal } from "../../common/modal/Modal";
import surface from "../hooks.module.css";
import type { HooksCopy } from "../shared/hooks-copy";

export function DisconnectYouTrackDialog({ copy, busy, onClose, onConfirm }: {
  copy: HooksCopy;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={copy.disconnectTitle} onClose={onClose} panelClassName={surface.disconnectDialog}>
      <div className={surface.disconnectBody}>
        <p>{copy.disconnectText}</p>
        <div className={surface.disconnectActions}>
          <button type="button" className={surface.secondaryButton} onClick={onClose} disabled={busy}>
            {copy.cancel}
          </button>
          <button type="button" className={surface.dangerButton} onClick={onConfirm} disabled={busy}>
            <Unplug size={15} aria-hidden="true" />
            {busy ? copy.saving : copy.disconnectConfirm}
          </button>
        </div>
      </div>
    </Modal>
  );
}
