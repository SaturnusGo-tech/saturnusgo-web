import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { LoadingOrb } from "../../../../../../../shared/components/loading/LoadingOrb";
import { ChevronDown, Download, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Project } from "../../../../../../../core/tms/contracts/legacy-contract";
import { ErrorToast } from "../../../../../presentation/common/error/ErrorToast";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { useExportCases } from "../../../state/export/use-export-cases";
import css from "./export-cases.module.css";

type Props = { projects: readonly Project[]; project: Project; enabled: boolean; disabled?: boolean };

export function ExportCasesAction({ projects, project, enabled, disabled = false }: Props) {
  const { t, locale } = useTmsLocale();
  const ru = locale === "ru";
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const captureModal = useCallback((node: HTMLHeadingElement | null) => {
    setPortalContainer(node?.closest<HTMLElement>('[role="dialog"]') ?? null);
  }, []);
  const [projectId, setProjectId] = useState(project.id);
  const selected = projects.find(item => item.id === projectId);
  const available = enabled && !disabled && Boolean(selected);
  const exported = useExportCases(selected ?? project, available);
  useEffect(() => { if (exported.completed !== null) setOpen(false); }, [exported.completed]);
  useEffect(() => { if (!enabled || disabled || !projects.length) setOpen(false); }, [enabled, disabled, projects.length]);
  const close = () => { exported.cancel(); setOpen(false); };
  const label = ru ? "Экспортировать кейсы" : "Export test cases";
  const message = exported.completed !== null && selected
    ? `${selected.name}: ${t("config.exchangeExported", { count: exported.completed })}`
    : !enabled ? t("config.exchangeConnectedOnly") : "";
  return <div className={css.action}>
    <Button size="sm" radius="full" variant="flat" className={css.triggerButton}
      isDisabled={!enabled || disabled || !projects.length || exported.busy} startContent={<Download size={16} aria-hidden="true" />}
      onPress={() => {
        if (!enabled || disabled || !projects.length || exported.busy) return;
        setOpen(true);
      }}>{label}</Button>
    {!open && message && <p className={css.status} role="status">{message}</p>}
    <Modal isOpen={open} onClose={close} placement="center" scrollBehavior="inside" hideCloseButton disableAnimation={Boolean(reducedMotion)}
      motionProps={{ initial: { opacity: reducedMotion ? 1 : 0, scale: reducedMotion ? 1 : .98 },
        animate: { opacity: 1, scale: 1 }, exit: { opacity: reducedMotion ? 1 : 0, scale: reducedMotion ? 1 : .98 },
        transition: { duration: reducedMotion ? 0 : .2, ease: [.22, 1, .36, 1] } }}
      classNames={{ base: css.dialog, backdrop: css.backdrop, wrapper: css.wrapper }}>
      <ModalContent aria-label={label}>
        <ModalHeader as="header" className={css.header}>
          <h2 ref={captureModal}>{label}</h2>
          <Button isIconOnly size="sm" radius="full" variant="light" className={css.closeButton}
            aria-label={ru ? "Закрыть" : "Close"} onPress={close}><X size={17} aria-hidden="true" /></Button>
        </ModalHeader>
        <ModalBody className={css.body}>
          <Select label={ru ? "Проект для экспорта" : "Project to export"} labelPlacement="outside" variant="bordered" placeholder={ru ? "Выберите проект" : "Choose a project"}
            selectedKeys={selected ? [selected.id] : []} disallowEmptySelection isDisabled={!enabled || disabled}
            selectorIcon={<ChevronDown size={16} aria-hidden="true" />} disableAnimation={Boolean(reducedMotion)}
            popoverProps={{ portalContainer: portalContainer ?? undefined, isNonModal: true }}
            classNames={{ base: css.selectBase, label: css.selectLabel, trigger: css.selectTrigger, innerWrapper: css.selectInner,
              value: css.selectValue, selectorIcon: css.selectChevron, popoverContent: css.popover, listbox: css.options }}
            listboxProps={{ classNames: { list: css.optionList }, itemClasses: { base: css.option, title: css.optionTitle, selectedIcon: css.selectedIcon } }}
            onSelectionChange={keys => {
              if (keys === "all") return;
              const next = projects.find(item => keys.has(item.id));
              if (next && next.id !== projectId) { exported.cancel(); setProjectId(next.id); }
            }}>
            {projects.map(item => <SelectItem key={item.id} textValue={item.name} aria-label={item.name}>
              <span className={css.optionName}>{item.name}</span><span className={css.projectKey}>{item.key}</span>
            </SelectItem>)}
          </Select>
          {selected && <p className={css.scope}>
            {ru ? "Текущие редакции всех кейсов проекта " : "Current revisions of all test cases in "}<strong>{selected.name}</strong>
            {ru ? ", включая архивные. Активные папки, в том числе пустые, сохраняются в JSON."
              : ", including archived cases. Active folders, including empty folders, are included in the JSON file."}
          </p>}
          <ErrorToast message={exported.error} />
          {exported.busy && <p className={css.status} role="status">{t("config.exchangeExporting")}</p>}
        </ModalBody>
        <ModalFooter className={css.footer}>
          <Button size="sm" radius="full" variant="light" className={css.cancelButton} onPress={close}>{ru ? "Отмена" : "Cancel"}</Button>
          <Button size="sm" radius="full" className={css.downloadButton} isLoading={exported.busy} spinner={<LoadingOrb />}
            isDisabled={!available || exported.busy} aria-label={ru ? `Скачать JSON проекта ${selected?.name ?? ""}` : `Download JSON for ${selected?.name ?? ""}`} startContent={!exported.busy && <Download size={15} aria-hidden="true" />}
            onPress={() => { if (available && !exported.busy) void exported.start(); }}>{ru ? "Скачать JSON" : "Download JSON"}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  </div>;
}
