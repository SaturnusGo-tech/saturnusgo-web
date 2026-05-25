"use client";

import { ToastProvider } from "../../../../../shared/shared/toast/Toast";
import { CoreHomeView } from "../../../ui";
import { useCoreHomeController } from "../hook/hook";

export default function CoreHomeScreen() {
  const controller = useCoreHomeController();

  return (
    <ToastProvider>
      <CoreHomeView {...controller} />
    </ToastProvider>
  );
}
