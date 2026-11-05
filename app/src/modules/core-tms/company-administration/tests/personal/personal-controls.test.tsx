import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import type { MemberSecurity } from "../../presentation/member-edit/MemberSecurity";
import type { MemberDetail } from "../../presentation/member-detail/MemberDetail";
import type { CompanyMember } from "../../domain/administration";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { administrationCopy } from "../../presentation/copy/administration-copy";
const member = { identityId: "managed-person", name: "Sam QA", login: "sam", email: "sam@example.test", phone: "", role: "workspace_admin", owner: false, status: "active", mfaEnabled: true, emailVerified: true, hasAvatar: false, version: 1, createdAt: "2026-11-01T00:00:00Z" } as CompanyMember;
const locale = { useTmsLocale: () => ({ locale: "en" }) };

test("personal owners retain role administration without an ownership-transfer action", () => {
  for (const canTransferOwnership of [false, true]) {
    const h = componentHarness();
    const { MemberSecurity: view } = h.load<{ MemberSecurity: typeof MemberSecurity }>(new URL("../../presentation/member-edit/MemberSecurity.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return locale;
      if (name.endsWith("administration-copy")) return { administrationCopy };
    });
    const all = nodes(h.render(() => view({ member, disabled: false, allowAdmin: true, canTransferOwnership, onChange: async () => true })));
    assert.equal(all.some(node => node.type === "button" && node.props.children === administrationCopy("en").ownerTransfer), canTransferOwnership);
    assert.equal(all.find(node => node.type === "RoleField")!.props.allowAdmin, true);
  }
});

test("personal details block ownership commands and omit managed password/TOTP reauthentication", async () => {
  for (const personal of [true, false]) {
    let commands = 0;
    const h = componentHarness();
    const { MemberDetail: view } = h.load<{ MemberDetail: typeof MemberDetail }>(new URL("../../presentation/member-detail/MemberDetail.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return locale;
      if (name.endsWith("administration-copy")) return { administrationCopy };
      if (name.endsWith("useAdministrationResource")) return { useAdministrationResource: () => ({ loading: false, refreshing: false, value: member, error: null, refresh() {} }) };
      if (name.endsWith("useAdministrationCommand")) return { useAdministrationCommand: () => ({ pending: false, error: "REAUTHENTICATION_REQUIRED", clearError() {}, async execute() { commands++; return { member }; } }) };
    });
    const all = nodes(h.render(() => view({ id: member.identityId, client: {} as AdministrationPort,
      actor: { id: "owner", owner: true, canTransferOwnership: !personal, managedReauthentication: !personal, memberAvatars: !personal }, onBack() {}, onSaved() {}, onBusy() {} })));
    const profile = all.find(node => node.type === "MemberProfile")!;
    const notice = nodes(profile.props.notice);
    assert.equal(notice.some(node => node.type === "SessionConfirmation"), !personal);
    if (personal) assert.ok(notice.some(node => node.props.role === "alert" && String(node.props.children).includes("fresh sign-in")));
    const security = nodes(profile.props.children).find(node => node.type === "MemberSecurity")!;
    assert.equal(security.props.canTransferOwnership, !personal);
    await invoke(security, "onChange", { kind: "ownership" });
    assert.equal(commands, personal ? 0 : 1);
  }
});
