"use client";
import { useEffect, useMemo } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { createCompanySsoClient } from "../data/company-sso-client";
import { useCompanySso } from "../application/useCompanySso";
import { CompanySsoScreen } from "../presentation/screen/CompanySsoScreen";

export function CompanySsoFeature({ client }: { readonly client: AdministrationPort }) {
  const port = useMemo(() => createCompanySsoClient(), []);
  const model = useCompanySso(port);
  useEffect(() => {
    if (!model.destination) return;
    const destination = new URL(model.destination);
    if (destination.protocol === "https:") window.location.assign(destination.href);
  }, [model.destination]);
  return <CompanySsoScreen model={model} client={client} />;
}
