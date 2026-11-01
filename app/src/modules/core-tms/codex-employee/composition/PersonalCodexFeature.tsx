"use client";
import { useMemo } from "react";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { createCodexEmployeeApi } from "../data/http/codex-employee-api";
import { useCodexEmployee } from "../application/state/useCodexEmployee";
import { PersonalCodexConnection } from "../presentation/personal/PersonalCodexConnection";
export function PersonalCodexFeature() {
    const http = useTmsHttpClient();
    const { locale } = useTmsLocale();
    const api = useMemo(() => createCodexEmployeeApi(http), [http]);
    const state = useCodexEmployee(api);
    return <PersonalCodexConnection state={state} locale={locale}/>;
}
