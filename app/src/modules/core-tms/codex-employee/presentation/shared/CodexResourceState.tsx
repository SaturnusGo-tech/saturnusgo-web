import React from "react";
import { codexCopy } from "../copy/codex-copy";
import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
export function CodexResourceState({ loading, error, locale, retry }: {
    loading: boolean;
    error: string | null;
    locale: "en" | "ru";
    retry: () => void;
}) {
    const copy = codexCopy(locale);
    if (loading)
        return <p role="status">{copy.loading}</p>;
    if (!error)
        return null;
    const message = /QUOTA|LIMIT/.test(error) ? copy.quota : /ACCESS_DENIED|FORBIDDEN|AUTH/.test(error) ? copy.permissions : copy.error;
    return <ErrorToast message={message} retryLabel={copy.retry} onRetry={retry} />;
}
