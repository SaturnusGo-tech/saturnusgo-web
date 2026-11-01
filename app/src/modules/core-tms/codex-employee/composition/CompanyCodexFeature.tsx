"use client";
import { useMemo } from "react";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { createCodexEmployeeApi } from "../data/http/codex-employee-api";
import { useCodexEmployee } from "../application/state/useCodexEmployee";
import { CodexEmployeeManagement } from "../presentation/management/CodexEmployeeManagement";
export function CompanyCodexFeature() {
    const http = useTmsHttpClient();
    const { locale } = useTmsLocale();
    const api = useMemo(() => createCodexEmployeeApi(http), [http]);
    const state = useCodexEmployee(api);
    return <CodexEmployeeManagement state={state} locale={locale}/>;
}
