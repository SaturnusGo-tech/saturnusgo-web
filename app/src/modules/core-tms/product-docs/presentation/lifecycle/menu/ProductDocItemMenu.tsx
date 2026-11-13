"use client";
import { Button, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { useProviderContext } from "@heroui/system";
import { useReducedMotion } from "framer-motion";
import { Archive, EllipsisVertical, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AnchoredDropdown } from "../../../../../../shared/components/anchored-popup/dropdown/AnchoredDropdown";
import type { ProductDocNode } from "../../../domain/product-docs";
import type { ProductDocLifecycleMode, ProductDocLifecyclePermissions } from "../../../domain/lifecycle/product-doc-lifecycle";
import type { ProductDocLifecycleContext } from "../../../state/lifecycle/product-doc-lifecycle-context";
import type { ProductDocMenuItem } from "./product-doc-menu-item";
import { ProductDocLifecycleDialog } from "../dialog/ProductDocLifecycleDialog";
import styles from "./item-menu.module.css";

export function ProductDocItemMenu({ context, node, permissions, items = [], disabled = false, tree = false, buttonRef }: {
  context: ProductDocLifecycleContext; node: ProductDocNode; permissions: ProductDocLifecyclePermissions;
  items?: readonly ProductDocMenuItem[]; disabled?: boolean; tree?: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}) {
  const owner = useMemo(() => ({}), [context.api, context.ownerId, context.scope.workspaceId, context.scope.projectId, node.id]);
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<{ owner: object; mode: ProductDocLifecycleMode }>();
  const mode = dialog?.owner === owner ? dialog.mode : undefined;
  const localTrigger = useRef<HTMLButtonElement>(null), trigger = buttonRef ?? localTrigger;
  const pending = useRef<{ owner: object; key: string; run(): void } | null>(null);
  const menuElement = useRef<HTMLElement | null>(null);
  const provider = useProviderContext();
  const reduced = useReducedMotion(), instant = Boolean(reduced || provider?.disableAnimation);
  const { copy } = context;
  const actions = [...items,
    ...(permissions.canArchive === true && !node.archivedAt ? [{ key: "archive", label: copy.archiveItem,
      icon: <Archive size={15} aria-hidden="true" />, run: () => setDialog({ owner, mode: "archive" }) }] : []),
    ...(permissions.canDelete === true ? [{ key: "delete", label: copy.deleteItem,
      icon: <Trash2 size={15} aria-hidden="true" />, run: () => setDialog({ owner, mode: "delete" }) }] : []),
  ];
  const active = useRef({ owner, disabled, live: true, actions }); active.current = { owner, disabled, live: true, actions };
  useEffect(() => { if (disabled) { pending.current = null; setOpen(false); } }, [disabled]);
  useEffect(() => {
    if (active.current.owner === owner) active.current.live = true;
    return () => {
      if (active.current.owner === owner) active.current.live = false;
      if (pending.current?.owner === owner) pending.current = null;
    };
  }, [owner]);
  function afterClose() {
    const action = pending.current;
    if (action?.owner !== owner) return;
    pending.current = null;
    const current = active.current;
    if (current.owner === owner && current.live && !current.disabled && current.actions.some(item => item.key === action.key)) {
      // The next FocusScope must remember the stable trigger, not the outgoing menu item.
      if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true });
      action.run();
    }
  }
  const captureMenu = useCallback((element: HTMLElement | null) => {
    const previous = menuElement.current;
    menuElement.current = element;
    if (element || !previous || pending.current?.owner !== owner) return;
    // Ref churn can occur during rendering. Wait for committed DOM removal, then let
    // React Aria's unmount restoration run before opening another FocusScope.
    queueMicrotask(() => {
      if (!previous.isConnected) requestAnimationFrame(afterClose);
    });
  }, [owner]);
  if (!actions.length) return null;
  return <>
    <AnchoredDropdown isOpen={open && !disabled} placement="bottom-end" offset={5} shouldBlockScroll={false}
      shouldCloseOnScroll={false} disableAnimation={instant} classNames={{ content: styles.menu }}
      onOpenChange={(next) => {
        if (active.current.owner !== owner || !active.current.live || active.current.disabled) return;
        setOpen(next && !disabled);
      }}>
      <DropdownTrigger>
        <Button ref={trigger} data-doc-item-menu data-tree={tree || undefined} isIconOnly size="sm" variant="light" disableAnimation
          className={styles.trigger} isDisabled={disabled} aria-label={`${copy.pageActions}: ${node.title}`}>
          <EllipsisVertical size={16} aria-hidden="true" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu ref={captureMenu} aria-label={`${copy.pageActions}: ${node.title}`} classNames={{ list: styles.list }}
        itemClasses={{ base: styles.item, title: styles.title }} onAction={key => {
          const current = active.current, action = current.actions.find(item => item.key === key);
          if (current.owner === owner && current.live && !current.disabled && !pending.current && action) {
            pending.current = { owner, key: action.key, run: action.run };
          }
        }}>
        {actions.map(action => <DropdownItem key={action.key} textValue={action.label} startContent={action.icon}
          className={action.key === "delete" ? styles.destructive : undefined}>{action.label}</DropdownItem>)}
      </DropdownMenu>
    </AnchoredDropdown>
    {mode && <ProductDocLifecycleDialog key={`${node.id}:${mode}`} context={{ ...context,
      onCompleted: (...args) => { setDialog(undefined); context.onCompleted(...args); },
    }} node={node} mode={mode} canEdit={permissions.canEdit === true} onClose={stale => {
      setDialog(undefined);
      if (stale) context.onChanged();
    }} />}
  </>;
}
