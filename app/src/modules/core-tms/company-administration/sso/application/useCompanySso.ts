"use client";
import { useCallback, useState } from "react";
import type { CompanySsoPort } from "./company-sso-port";
import type { CompanySsoDraft, CompanySsoSubjectRequest } from "../domain/company-sso";
import { useAdministrationResource } from "../../application/state/useAdministrationResource";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";

export function useCompanySso(client: CompanySsoPort) {
  const resource = useAdministrationResource(useCallback(signal => client.get(signal), [client]));
  const subjects = useAdministrationResource(useCallback(signal => client.subjects(signal), [client]));
  const command = useAdministrationCommand();
  const [destination, setDestination] = useState<string | null>(null);
  async function change(kind: "enable" | "enforce", enabled: boolean) {
    const version = resource.value?.version;
    if (version == null || resource.error || resource.refreshing) return;
    const result = await command.execute(JSON.stringify([kind, version, enabled]), (_, signal) => client[kind](version, enabled, signal));
    if (result) resource.refresh();
  }
  return { resource, subjects, command, destination,
    save: async (draft: CompanySsoDraft) => {
      const result = await command.execute(JSON.stringify(draft), (_, signal) => client.save(draft, signal));
      if (result) resource.refresh();
    },
    bind: async (subject: CompanySsoSubjectRequest) => {
      const result = await command.execute(JSON.stringify(subject), (_, signal) => client.bind(subject, signal));
      if (result) subjects.refresh();
    },
    test: async () => {
      const result = await command.execute("sso-test", (_, signal) => client.test(signal));
      if (result) setDestination(result.authorizationUrl);
    },
    enable: (enabled: boolean) => change("enable", enabled),
    enforce: (enforced: boolean) => change("enforce", enforced),
  };
}
