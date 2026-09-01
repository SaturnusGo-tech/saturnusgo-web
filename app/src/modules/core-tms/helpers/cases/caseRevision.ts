import type { TestCaseRevision, TestStep } from "../../../../core/tms/contracts/legacy-contract";
import type { TmsLocale } from "../../localization/model/locale";
import { createUid } from "../id/createUid";

const TEST_CASE_TAG = /^[a-z0-9][a-z0-9._-]{0,63}$/;

export function createEmptyRevision(locale: TmsLocale = "en"): TestCaseRevision {
  return {
    revision: 1,
    title: "",
    description: "",
    preconditions: "",
    type: "manual",
    lifecycle: "draft",
    priority: "medium",
    component: locale === "ru" ? "Основной продукт" : "Core product",
    ownerIdentityId: null,
    tags: [],
    estimatedMinutes: 5,
    testData: "",
    steps: [
      {
        id: createUid("step"),
        order: 1,
        action: "",
        expectedResult: "",
        required: true,
      },
    ],
    checklist: [],
    attachmentIds: [],
    changeNote: locale === "ru" ? "Создано в TMS" : "Created in TMS",
    createdAt: new Date().toISOString(),
  };
}

export function changeRevisionType(
  revision: TestCaseRevision,
  type: TestCaseRevision["type"],
): TestCaseRevision {
  if (type === revision.type) return revision;
  return type === "checklist"
    ? { ...revision, type, steps: [] }
    : { ...revision, type, checklist: [] };
}

export function discardedProcedureCount(
  revision: TestCaseRevision,
  type: TestCaseRevision["type"],
): number {
  if (revision.type === type) return 0;
  if (revision.type === "checklist" && type !== "checklist") {
    return revision.checklist.filter((item) => item.text.trim()).length;
  }
  if (revision.type !== "checklist" && type === "checklist") {
    return revision.steps.filter((step) => (
      step.action.trim()
      || step.expectedResult.trim()
      || step.testData?.trim()
      || step.attachmentIds?.length
    )).length;
  }
  return 0;
}

export function normalizeRevisionTags(tags: readonly string[]): string[] {
  const normalized = tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  return normalized.filter((tag, index) => normalized.indexOf(tag) === index);
}

export function revisionTagsAreValid(tags: readonly string[]): boolean {
  const normalized = normalizeRevisionTags(tags);
  return normalized.length <= 100 && normalized.every((tag) => TEST_CASE_TAG.test(tag));
}

export function executableSteps(
  revision: TestCaseRevision,
  locale: TmsLocale = "en",
): TestStep[] {
  if (revision.type === "checklist") {
    return revision.checklist.map((item) => ({
      id: item.id,
      order: item.order,
      action: item.text,
      expectedResult:
        locale === "ru" ? "Проверка подтверждена" : "The check is confirmed",
      required: item.required,
    }));
  }
  return revision.steps;
}
