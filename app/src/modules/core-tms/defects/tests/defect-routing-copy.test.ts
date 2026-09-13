import assert from "node:assert/strict";
import test from "node:test";
import { getDefectDialogCopy } from "../../presentation/dialogs/defect/copy";
import { defectRouteChoices } from "../presentation/defect-route-choices";
import { resolveDefectIntegrationChoice } from "../model/integration-target";

test("automatic routing uses project settings across saved YouTrack configurations", () => {
  for (const locale of ["ru", "en"] as const) {
    const copy = getDefectDialogCopy(locale);
    assert.equal(copy.routingLabel, locale === "ru" ? "Передача" : "Delivery");
    assert.equal(copy.projectIntegrations, locale === "ru" ? "Автоматически" : "Automatic");
    for (const configurationVersion of [null, 1, 2]) {
      for (const enabled of [false, true]) {
        const options = defectRouteChoices({ configurationVersion, enabled, options: [] }, copy);
        const automatic = options.find((option) => option.label === copy.projectIntegrations);
        assert.ok(automatic);
        assert.deepEqual(resolveDefectIntegrationChoice(automatic.value), { resolved: true, target: null });
        assert.equal(options.some((option) => /Falcon only|Только Falcon/.test(option.label)), false);
      }
    }
  }
});

test("explicit YouTrack choices remain clearly identified and preserve route IDs", () => {
  const routes = [{ value: "route-acceptance", label: "Acceptance" }];
  for (const configurationVersion of [1, 2]) {
    const options = defectRouteChoices({ configurationVersion, enabled: true, options: routes }, getDefectDialogCopy("en"));
    const explicit = options.find((option) => option.value === "route-acceptance");
    assert.equal(explicit?.label, "YouTrack · Acceptance");
    assert.equal(resolveDefectIntegrationChoice(explicit!.value).target, "route-acceptance");
  }
  assert.deepEqual(routes, [{ value: "route-acceptance", label: "Acceptance" }]);
});
