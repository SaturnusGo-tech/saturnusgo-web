import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes } from "../../../../../portfolios/tests/support/component-harness";
import { relatedCasesChanged, toggleRelatedCases } from "../../../../domain/related-cases/product-doc-related-cases";
import type { RelatedCasePicker } from "../RelatedCasePicker";
import type { ProductDocRelatedCaseSelection } from "../../../../domain/related-cases/product-doc-related-cases";
import type { TessiqLoader } from "../../../../../presentation/common/loading/TessiqLoader";
import type { useLoadingFeedback } from "../../../../../presentation/common/loading/feedback/useLoadingFeedback";

test("bulk picker retains unseen links, applies deduplicated selections, and ignores changes during save", async () => {
  const h = componentHarness();
  const { RelatedCasePicker: render } = h.load<{ RelatedCasePicker: typeof RelatedCasePicker }>(new URL("../RelatedCasePicker.tsx", import.meta.url), name =>
    name === "framer-motion" ? { useReducedMotion: () => false, motion: { div: "motion.div" }, AnimatePresence: "AnimatePresence" }
      : name.endsWith("useLoadingFeedback") ? { useLoadingFeedback: (pending: boolean) => pending }
      : name.endsWith("useProductDocCaseCatalog") ? { useProductDocCaseCatalog: () => ({ status: "ready", data: {
      cases: [{ id: "a", title: "A" }, { id: "b", title: "B" }], folders: [] } }) }
      : name.endsWith("product-doc-related-cases") ? { relatedCasesChanged, toggleRelatedCases } : undefined);
  let applied: ProductDocRelatedCaseSelection | undefined;
  const props = { scope: { workspaceId: "w", projectId: "p" }, baseline: [{ caseId: "unseen", title: "Existing case", sectionId: "s" }],
    projectName: "Project", ru: false, busy: false, failed: false, onCancel() {}, async onApply(value: ProductDocRelatedCaseSelection) { applied = value; } };
  const read = (busy = false) => nodes(h.render(() => render({ ...props, busy })));
  const picker = read().find(node => node.type === "RelatedCaseBrowser")!;
  (picker.props.onScope as (ids: string[]) => void)(["a", "b", "a"]);
  const duringSave = read(true).find(node => node.type === "RelatedCaseBrowser")!;
  (duringSave.props.onToggle as (id: string) => void)("a");
  const final = read();
  const apply = final.find(node => node.type === "Button" && node.props.color === "primary")!;
  await (apply.props.onPress as () => Promise<void>)();
  assert.ok(applied);
  assert.equal(applied.cases.map(item => item.caseId).join(","), "unseen,a,b");
  assert.equal(applied.cases[0].sectionId, "s");
  assert.equal(applied.baseline.map(item => item.caseId).join(","), "unseen");
  h.dispose();
});


test("unavailable authoritative links block Apply while keeping Back available", () => {
  const h = componentHarness();
  const { RelatedCasePicker: render } = h.load<{ RelatedCasePicker: typeof RelatedCasePicker }>(new URL("../RelatedCasePicker.tsx", import.meta.url), name =>
    name === "framer-motion" ? { useReducedMotion: () => false, motion: { div: "motion.div" }, AnimatePresence: "AnimatePresence" }
      : name.endsWith("useLoadingFeedback") ? { useLoadingFeedback: (pending: boolean) => pending }
      : name.endsWith("useProductDocCaseCatalog") ? { useProductDocCaseCatalog: () => ({ status: "ready", data: {
      cases: [{ id: "a", title: "A" }], folders: [] } }) }
      : name.endsWith("product-doc-related-cases") ? { relatedCasesChanged, toggleRelatedCases } : undefined);
  const props = { scope: { workspaceId: "w", projectId: "p" }, baseline: [], projectName: "Project", ru: false,
    busy: false, failed: true, canApply: false, onCancel() {}, async onApply() {} };
  const read = () => nodes(h.render(() => render(props)));
  const picker = read().find(node => node.type === "RelatedCaseBrowser")!;
  (picker.props.onToggle as (id: string) => void)("a");
  const buttons = read().filter(node => node.type === "Button");
  assert.equal(buttons.find(node => node.props.color === "primary")!.props.isDisabled, true);
  assert.equal(buttons.find(node => node.props.variant === "light")!.props.isDisabled, false);
  h.dispose();
});

test("slow catalog loading shows the Falcon intro briefly and never presents failures as an empty repository", t => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const h = componentHarness(undefined, { Date, setTimeout, clearTimeout });
  const loader = h.load<{ TessiqLoader: typeof TessiqLoader }>(new URL("../../../../../presentation/common/loading/TessiqLoader.tsx", import.meta.url));
  const feedbackHook = h.load<{ useLoadingFeedback: typeof useLoadingFeedback }>(new URL("../../../../../presentation/common/loading/feedback/useLoadingFeedback.ts", import.meta.url));
  let status: "loading" | "error" | "ready" = "loading";
  const { RelatedCasePicker: render } = h.load<{ RelatedCasePicker: typeof RelatedCasePicker }>(new URL("../RelatedCasePicker.tsx", import.meta.url), name =>
    name === "framer-motion" ? { useReducedMotion: () => false, motion: { div: "motion.div" }, AnimatePresence: "AnimatePresence" }
      : name.endsWith("useLoadingFeedback") ? feedbackHook
      : name.endsWith("useProductDocCaseCatalog") ? { useProductDocCaseCatalog: () => ({ status, data: { cases: [], folders: [] } }) }
      : name.endsWith("TessiqLoader") ? loader
        : name.endsWith("product-doc-related-cases") ? { relatedCasesChanged, toggleRelatedCases } : undefined);
  const props = { scope: { workspaceId: "w", projectId: "p" }, baseline: [], projectName: "Project", ru: false,
    busy: false, failed: false, onCancel() {}, async onApply() {} };
  const read = () => nodes(h.render(() => render(props)));
  try {
    const opening = read();
    assert.equal(opening.some(node => node.type as unknown === loader.TessiqLoader), false);
    assert.equal(opening.some(node => node.props.role === "status"), true);
    t.mock.timers.tick(300);
    const loading = read();
    assert.equal(loading.some(node => node.type === "fieldset"), false);
    const fallback = loading.find(node => node.type as unknown === loader.TessiqLoader);
    assert.ok(fallback, "opening must use the existing Falcon loading component");
    const feedback = loader.TessiqLoader(fallback.props as Parameters<typeof TessiqLoader>[0]);
    assert.equal(feedback.props.role, "status");
    assert.equal(feedback.props["aria-busy"], "true");
    assert.equal(nodes(feedback).some(node => node.props.intro === true), true);
    assert.equal(loading.find(node => node.props.color === "primary")?.props.isDisabled, true);
    status = "error";
    read();
    t.mock.timers.tick(250);
    const error = read();
    assert.equal(error.some(node => node.type === "fieldset"), false);
    assert.equal(error.some(node => node.type as unknown === loader.TessiqLoader), false);
    assert.equal(error.some(node => node.type === "ErrorToast"), true);
    assert.equal(error.find(node => node.props.variant === "light")?.props.isDisabled, false);
    status = "ready";
    assert.equal(read().some(node => node.type === "fieldset"), true);
    status = "loading"; read();
    t.mock.timers.tick(299);
    status = "ready";
    const quick = read();
    assert.equal(quick.some(node => node.type === "fieldset"), true);
    assert.equal(quick.some(node => node.type as unknown === loader.TessiqLoader), false, "quick responses must not flash the intro");
    t.mock.timers.tick(1000);
    assert.equal(read().some(node => node.type as unknown === loader.TessiqLoader), false);
  } finally { h.dispose(); }
});
