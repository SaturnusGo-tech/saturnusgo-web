import { IntegrationButton } from "../../common/integration-controls/button/IntegrationButton";
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
    <Modal title={copy.disconnectTitle} onClose={() => { if (!busy) onClose(); }} panelClassName={surface.disconnectDialog}>
      <div className={surface.disconnectBody}>
        <p>{copy.disconnectText}</p>
        <div className={surface.disconnectActions}>
          <IntegrationButton variant="light" onPress={onClose} isDisabled={busy}>
            {copy.cancel}
          </IntegrationButton>
          <IntegrationButton color="danger" onPress={onConfirm} isDisabled={busy} isLoading={busy}>
            <Unplug size={15} aria-hidden="true" />
            {busy ? copy.saving : copy.disconnectConfirm}
          </IntegrationButton>
        </div>
      </div>
    </Modal>
  );
}
