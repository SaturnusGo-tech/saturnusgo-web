import { Autocomplete, AutocompleteItem, BreadcrumbItem, Breadcrumbs, Button, Select, SelectItem } from "@heroui/react";
import { ChevronLeft, Folder } from "lucide-react";
import type { Project } from "../../../../../../../core/tms/contracts/legacy-contract";
import { ErrorToast } from "../../../../../presentation/common/error/ErrorToast";
import { LoadingOrb } from "../../../../../../../shared/components/loading/LoadingOrb";
import type { useImportCases } from "../../../state/import/use-import-cases";
import { importCopy } from "../../../localization/import-copy";
import css from "../page/import-page.module.css";

export function ImportDestination({ state, projects, ru, onBack }: {
  state: ReturnType<typeof useImportCases>; projects: readonly Project[]; ru: boolean; onBack: () => void;
}) {
  const copy = importCopy[ru ? "ru" : "en"];
  const folders = [{ id: "/", path: "/", name: copy.root }, ...(state.context?.folders ?? []).filter(folder => !folder.archivedAt)];
  const ready = state.context && !state.loadingTarget && state.plan && (state.document?.testCases.length || state.plan.folders.length);
  return <section className={css.destinationStage}>
    <Button size="sm" radius="full" variant="light" className={css.back} onPress={onBack}
      startContent={<ChevronLeft size={16} aria-hidden="true" />}>{ru ? "Предпросмотр" : "Review"}</Button>
    <h2>{ru ? "Куда импортировать кейсы?" : "Where should these cases go?"}</h2>
    <p className={css.description}>{copy.rules}</p>
    <div className={css.destinationFields}>
      <Select label={ru ? "Проект" : "Project"} labelPlacement="outside" variant="flat"
        selectedKeys={projects.some(project => project.id === state.targetProject.id) ? [state.targetProject.id] : []}
        classNames={{ base: css.selectBase, label: css.selectLabel, trigger: css.selectTrigger, innerWrapper: css.selectInner, value: css.selectValue, selectorIcon: css.selectIcon, popoverContent: css.selectPopover }}
        listboxProps={{ classNames: { base: css.listbox, list: css.options }, itemClasses: { base: css.option } }} disallowEmptySelection
        onSelectionChange={keys => {
          if (keys !== "all") { const project = projects.find(item => keys.has(item.id)); if (project) state.selectProject(project); }
        }}>{projects.map(project => <SelectItem key={project.id} textValue={project.name}>{project.name}</SelectItem>)}</Select>
      <div className={css.selectBase}><span className={css.selectLabel} aria-hidden="true">{ru ? "Папка" : "Folder"}</span>
      <Autocomplete variant="flat" isClearable={false}
        selectedKey={state.destination} isDisabled={state.loadingTarget || !state.context}
        startContent={<Folder size={17} aria-hidden="true" />} aria-label={copy.destination}
        classNames={{ base: css.selectBase }} selectorButtonProps={{ className: css.selectIconButton, "aria-label": ru ? "Выбрать папку" : "Choose folder" }}
        inputProps={{ classNames: { base: css.selectBase, label: css.selectLabel, mainWrapper: css.fieldMain, inputWrapper: css.selectTrigger, innerWrapper: css.selectInner, input: css.fieldInput } }}
        popoverProps={{ classNames: { content: css.selectPopover } }}
        listboxProps={{ emptyContent: copy.noFolder, classNames: { base: css.listbox, list: css.options }, itemClasses: { base: css.option } }} onSelectionChange={key => {
          if (key && folders.some(folder => folder.path === key)) state.setDestination(String(key));
        }}>{folders.map(folder => <AutocompleteItem key={folder.path} textValue={folder.name} aria-label={folder.path === "/" ? copy.root : folder.path.split("/").filter(Boolean).join(" → ")}>
          {folder.path === "/" ? copy.root : <Breadcrumbs size="sm" maxItems={3} itemsBeforeCollapse={1} itemsAfterCollapse={1}>
            {folder.path.split("/").filter(Boolean).map((part, index) => <BreadcrumbItem key={index} isDisabled>{part}</BreadcrumbItem>)}
          </Breadcrumbs>}</AutocompleteItem>)}</Autocomplete></div>
    </div>
    {state.loadingTarget && <p className={css.message} role="status"><LoadingOrb />{copy.loading}</p>}
    <ErrorToast message={state.error} />
    {!state.loadingTarget && !state.context && <Button variant="light" radius="full" className={css.quiet} onPress={state.retryContext}>{copy.retryLoad}</Button>}
    {state.plan && !state.loadingTarget && <dl className={css.destinationSummary}>
      <div><dt>{copy.cases}</dt><dd>{state.document?.testCases.length ?? 0}</dd></div>
      <div><dt>{copy.newFolders}</dt><dd>{state.plan.newFolderCount}</dd></div>
      <div><dt>{copy.existingFolders}</dt><dd>{state.plan.existingFolderCount}</dd></div>
    </dl>}
    <footer className={css.stepFooter}><p>{state.targetProject.name}</p>
      <Button radius="full" className={css.primary} isDisabled={!ready || state.busy} onPress={() => void state.start()}>{copy.start}</Button>
    </footer>
  </section>;
}
