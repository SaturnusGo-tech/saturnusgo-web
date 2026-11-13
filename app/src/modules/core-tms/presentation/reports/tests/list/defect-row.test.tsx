import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";
import { TmsLocaleContext, type TmsLocaleContextValue } from "../../../../localization/context/TmsLocaleProvider";
import { tmsMessages } from "../../../../localization/catalog/messages";
import type { TmsLocale } from "../../../../localization/model/locale";
import { localizedLabel } from "../../../../localization/format/labels";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";

const require = createRequire(import.meta.url);
const previousCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { DefectRow } = require("../../branches/DefectRow") as typeof import("../../branches/DefectRow");
const { PriorityIcon, priorityLabel } = require("../../../common/properties/PriorityIcon") as typeof import("../../../common/properties/PriorityIcon");
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];

const defect = { id: "defect-real-id", key: "GUIDE-BUG-81", title: "Savings balance stays unchanged after a transfer",
  priority: "high", severity: "critical", status: "verified", assigneeIdentityId: "actor-assigned" } as Defect;

function renderRow(locale: TmsLocale, onSelect: (id: string) => void, selected = true) {
  const value: TmsLocaleContextValue = { locale, languageTag: locale === "ru" ? "ru-RU" : "en-US",
    setLocale() {}, t: key => tmsMessages[locale][key] };
  return <TmsLocaleContext.Provider value={value}>
    <DefectRow defect={defect} selected={selected} onSelect={onSelect} />
  </TmsLocaleContext.Provider>;
}

for (const [locale, status, priority] of [["en", "Verified", "High"], ["ru", "Проверен", "Высокий"]] as const) {
  test(`compact ${locale} markup exposes the title and icon labels with one selection button`, t => {
    const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
    Object.assign(globalThis, { React });
    t.after(() => {
      if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React");
    });
    const markup = renderToStaticMarkup(renderRow(locale, () => {}));
    assert.equal(markup.replace(/<[^>]*>/g, ""), defect.title);
    assert.equal((markup.match(/<button\b/g) ?? []).length, 1);
    assert.match(markup, /aria-current="page"/);
    assert.ok(markup.includes(`aria-label="${priority}"`));
    assert.ok(markup.includes(`aria-label="${status}"`));
    assert.doesNotMatch(markup, /GUIDE-BUG-81|actor-assigned|Unassigned|Не назначен/);
    assert.doesNotMatch(renderToStaticMarkup(renderRow(locale, () => {}, false)), /aria-current/);
  });

  test(`${locale} status tooltip anchors to its icon rather than the full row`, t => {
    const h = componentHarness(); t.after(() => h.dispose());
    const { DefectRow: Row } = h.load<{ DefectRow: typeof DefectRow }>(new URL("../../branches/DefectRow.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale }) };
      if (name.endsWith("labels")) return { localizedLabel };
      if (name.endsWith("PriorityIcon")) return { PriorityIcon, priorityLabel };
      return undefined;
    });
    const selected: string[] = [];
    const tree = nodes(h.render(() => Row({ defect, selected: true, onSelect: id => selected.push(id) })));
    const tooltip = tree.find(node => node.type === "FalconTooltip")!;
    assert.equal(tooltip.props.label, status);
    const anchor = nodes(tooltip.props.children)[0];
    assert.equal(anchor.type, "span");
    assert.equal(anchor.props["aria-label"], status);
    assert.ok(nodes(anchor.props.children).some(node => node.type === "DefectStatusIcon"));
    const action = tree.find(node => node.type === "Button")!;
    assert.equal(action.props["aria-current"], "page");
    assert.equal(tree.filter(node => node.type === "Button" || node.type === "button").length, 1);
    assert.equal(tree.filter(node => node.props.tabIndex !== undefined).length, 0);
    invoke(action, "onPress");
    assert.deepEqual(selected, [defect.id]);
  });
}
