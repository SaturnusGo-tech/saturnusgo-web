import { Accordion, AccordionItem } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { IntegrationControlScope } from "../../../presentation/common/integration-controls/scope/IntegrationControlScope";
import css from "../editor.module.css";

/** HeroUI owns keyboard navigation, disclosure semantics and the height transition. */
export function SourceDisclosure({ title, summary, defaultOpen = false, disabled = false, children }: {
  title: string; summary: string; defaultOpen?: boolean; disabled?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reducedMotion = useReducedMotion();
  return <Accordion className={css.disclosure} variant="light" showDivider={false} keepContentMounted
    selectedKeys={open ? ["settings"] : []} onSelectionChange={keys => setOpen(keys === "all" || keys.has("settings"))}
    isDisabled={disabled} disableAnimation={Boolean(reducedMotion)} motionProps={{ initial: false, transition: { duration: .22, ease: [.22, 1, .36, 1] } }}
    itemClasses={{ base: css.option, heading: css.optionHeading, trigger: css.optionTrigger,
      title: css.optionTitle, titleWrapper: css.optionTitleWrapper, indicator: css.optionIndicator, content: css.optionBody }}>
    <AccordionItem key="settings" aria-label={title} title={<><span>{title}</span><span className={css.optionValue}>{summary}</span></>}
      indicator={<ChevronRight size={16} aria-hidden="true"/>}>
      <IntegrationControlScope disabled={!open || disabled}><div aria-hidden={!open || undefined} ref={element => { if (element) element.inert = !open; }}>{children}</div></IntegrationControlScope>
    </AccordionItem>
  </Accordion>;
}
