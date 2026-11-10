import React from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { ErrorToast } from "./ErrorToast";

export function FormError({ message, onRetry, retryLabel }: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const { t } = useTmsLocale();
  return <ErrorToast title={t("form.couldNotSave")} message={message} onRetry={onRetry} retryLabel={retryLabel} />;
}
