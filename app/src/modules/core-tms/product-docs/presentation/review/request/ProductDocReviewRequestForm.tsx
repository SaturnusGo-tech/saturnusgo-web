import { Button, Input, Select, SelectItem } from "@heroui/react";
import { Check, ChevronDown, Search } from "lucide-react";
import { useRef, useState } from "react";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import type { WorkspaceMember } from "../../../../workspace/members/model/member";
import { useWorkspaceMembers } from "../../../../workspace/members/state/useWorkspaceMembers";
import type { ProductDocReviewSection } from "../../../domain/review/productDocReview";
import type { ProductDocReviewCopy } from "../../../localization/review/review-copy";
import fields from "../../fields/product-doc-field.module.css";
import { productDocFieldSlots } from "../../fields/productDocFieldSlots";
import styles from "../review.module.css";

const sectionPrefix = "section:";

export function ProductDocReviewRequestForm({ workspaceId, sections, copy, busy, popoverContainer, onSubmit }: {
  workspaceId: string;
  sections: readonly ProductDocReviewSection[];
  copy: ProductDocReviewCopy;
  busy: boolean;
  popoverContainer?: HTMLElement;
  onSubmit(selection: { reviewerIdentityId: string; sectionId: string | null }): void;
}) {
  const [scope, setScope] = useState("article");
  const scopeField = useRef<HTMLDivElement>(null);
  const [reviewer, setReviewer] = useState<WorkspaceMember>();
  const members = useWorkspaceMembers(workspaceId, true);
  const targets = [
    { key: "article", label: copy.article },
    ...sections.map((section) => ({ key: sectionPrefix + section.id, label: section.title || copy.untitled })),
  ];
  const scopeLabel = targets.find((item) => item.key === scope)?.label ?? copy.article;
  const people = members.items.filter((item) => item.kind !== "agent");
  const selectedOutsideResults = reviewer && !people.some((person) => person.id === reviewer.id);
  return <form className={styles.form} onSubmit={(event) => {
    event.preventDefault();
    if (reviewer && !busy) onSubmit({
      reviewerIdentityId: reviewer.id, sectionId: scope.startsWith(sectionPrefix) ? scope.slice(sectionPrefix.length) : null,
    });
  }}>
    <div ref={scopeField}><Select label={copy.target} aria-label={`${copy.target}: ${scopeLabel}`} labelPlacement="outside"
      items={targets} disallowEmptySelection isDisabled={busy}
      onOpenChange={(open) => { if (open) scopeField.current?.querySelector<HTMLButtonElement>('button[data-slot="trigger"]')?.focus({ preventScroll: true }); }}
      selectedKeys={[scope]} onChange={(event) => { if (event.target.value) setScope(event.target.value); }}
      selectorIcon={<ChevronDown size={14} aria-hidden="true" />}
      classNames={{ base: fields.base, label: fields.label, trigger: styles.scopeTrigger, innerWrapper: styles.scopeInner, value: styles.scopeValue,
        selectorIcon: styles.scopeChevron, popoverContent: styles.scopeMenu, listbox: styles.scopeOptions }}
      popoverProps={{ portalContainer: popoverContainer, offset: 5 }}
      listboxProps={{ itemClasses: { base: styles.scopeOption } }}>
      {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
    </Select></div>
    <div className={styles.field}>
      <span>{copy.reviewer}</span>
      <div className={fields.host} data-input-shell>
        <Input type="search" aria-label={copy.findMember} placeholder={copy.findMember} maxLength={120}
          classNames={productDocFieldSlots} startContent={<Search size={14} aria-hidden="true" />}
          value={members.search} onValueChange={members.setSearch} isDisabled={busy} />
      </div>
      <div className={styles.people} role="group" aria-label={copy.reviewer} aria-busy={members.loading}>
        {[...(selectedOutsideResults ? [reviewer] : []), ...people].map((person) => (
          <Button key={person.id} className={styles.person} aria-pressed={reviewer?.id === person.id}
            isDisabled={busy} onPress={() => setReviewer(person)}>
            <MemberAvatar workspaceId={workspaceId} identityId={person.id} name={person.name}
              actor={{ identityId: person.id, kind: "human", name: person.name, email: person.email ?? null }} />
            <span><strong>{person.name}</strong>{person.email && <small>{person.email}</small>}</span>
            {reviewer?.id === person.id && <Check size={15} aria-hidden="true" />}
          </Button>
        ))}
        {members.loading && <p className={styles.message} role="status">{copy.membersLoading}</p>}
        {!members.loading && !members.error && people.length === 0 && <p className={styles.message}>{copy.membersEmpty}</p>}
        {members.error && <div className={styles.message} role="alert">{copy.membersError}
          <Button className={styles.textButton} onPress={members.retry}>{copy.retry}</Button>
        </div>}
        {members.cursor && <Button className={styles.textButton} onPress={members.more}
          isDisabled={busy || members.loading}>{copy.more}</Button>}
      </div>
    </div>
    <div className={styles.buttons}>
      <Button type="submit" className={styles.primary} isDisabled={busy || !reviewer}>{busy ? copy.busy : copy.send}</Button>
    </div>
  </form>;
}
