import { Check, ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import loadingStyles from "./project-loading.module.css";
import styles from "../../../tms.module.css";

type ProjectOption = { id: string; name: string };

export function ProjectSelector({
  activeProjectId,
  projects,
  disabled,
  currentProjectLabel,
  loadingProjectLabel,
  createProjectLabel,
  onSelect,
  onCreate,
}: {
  activeProjectId: string | null;
  projects: ProjectOption[];
  disabled: boolean;
  currentProjectLabel: string;
  loadingProjectLabel: string;
  createProjectLabel: string;
  onSelect: (projectId: string) => Promise<boolean | void> | void;
  onCreate: () => void;
}) {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeProject = projects.find((project) => project.id === activeProjectId);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  function closeAndRestoreFocus() {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  async function selectProject(projectId: string) {
    if (disabled || pendingRef.current) return;
    closeAndRestoreFocus();
    if (projectId === activeProjectId) return;
    pendingRef.current = true;
    setPending(true);
    try { await onSelect(projectId); }
    finally { pendingRef.current = false; setPending(false); }
  }

  return (
    <div className={styles.projectSelector} ref={rootRef}>
      <button
        ref={triggerRef}
        className={styles.projectSelectorTrigger}
        type="button"
        disabled={disabled || pending}
        aria-label={pending ? loadingProjectLabel : currentProjectLabel}
        aria-busy={pending}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => rootRef.current?.querySelector<HTMLButtonElement>("[role='menuitemradio']")?.focus());
          }
        }}
      >
        <span className={loadingStyles.name} data-loading={pending}>
          <strong className={loadingStyles.label} title={pending ? undefined : activeProject?.name} aria-hidden={pending || undefined}>{activeProject?.name ?? createProjectLabel}</strong>
          {pending && <span className={loadingStyles.skeleton} aria-hidden="true" />}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div
          className={styles.projectSelectorMenu}
          role="menu"
          aria-label={currentProjectLabel}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeAndRestoreFocus();
            }
          }}
        >
          <div className={styles.projectSelectorList}>
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                role="menuitemradio"
                aria-checked={project.id === activeProjectId}
                onClick={() => {
                  void selectProject(project.id);
                }}
              >
                <span>{project.name}</span>
                {project.id === activeProjectId && <Check size={15} aria-hidden="true" />}
              </button>
            ))}
          </div>
          <button
            className={styles.projectSelectorCreate}
            type="button"
            role="menuitem"
            onClick={() => {
              onCreate();
              closeAndRestoreFocus();
            }}
          >
            <Plus size={16} aria-hidden="true" />
            {createProjectLabel}
          </button>
        </div>
      )}
    </div>
  );
}
