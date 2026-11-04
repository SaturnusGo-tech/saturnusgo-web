import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useCompanySso } from "../../application/useCompanySso";
import type { CompanySsoPort } from "../../application/company-sso-port";
void test("subject mapping sends the loaded configuration version and refreshes both resources", async () => {
  let current!: ReturnType<typeof useCompanySso>, configLoads = 0, subjectLoads = 0;
  const requests: unknown[] = [], enabledVersions: number[] = [];
  const config = { configured: true, version: 4, idpIssuer: "issuer", entryPoint: "https://idp.example/", subjectAttribute: "NameID",
    certificates: [], enabled: true, enforced: false, testedAt: "2026-11-04T00:00:00Z", metadataUrl: "https://falcon.example/metadata", entityId: "sp", acsUrl: "https://falcon.example/acs" };
  const client: CompanySsoPort = {
    get: async () => { configLoads++; return { ...config }; }, subjects: async () => { subjectLoads++; return { subjects: [] }; },
    bind: async request => { requests.push(request); config.version++; return { subjects: [] }; },
    save: async () => config, test: async () => ({ authorizationUrl: "https://idp.example/" }), enable: async version => { enabledVersions.push(version); config.version++; return { ...config }; }, enforce: async () => config,
  };
  function Probe() { current = useCompanySso(client); return null; }
  let view!: ReactTestRenderer;
  await act(async () => { view = create(<Probe />); });
  await act(async () => { await current.bind({ subject: "stable-subject", identityId: "employee-1" }); });
  assert.deepEqual(requests, [{ subject: "stable-subject", identityId: "employee-1", version: 4 }]);
  assert.equal(configLoads, 2); assert.equal(subjectLoads, 2);
  assert.equal(current.resource.value?.version, 5);
  await act(async () => { await current.enable(false); });
  await act(async () => { await current.bind({ subject: "second-subject", identityId: "employee-2" }); });
  assert.deepEqual(enabledVersions, [5]);
  assert.deepEqual(requests[1], { subject: "second-subject", identityId: "employee-2", version: 6 });
  assert.equal(current.resource.value?.version, 7);
  await act(async () => view.unmount());
});
