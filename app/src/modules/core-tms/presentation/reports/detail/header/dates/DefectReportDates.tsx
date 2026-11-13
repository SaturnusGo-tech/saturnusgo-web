import { Button, Tooltip } from "@heroui/react";
import { Info } from "lucide-react";
import { useRef, useState } from "react";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import overlays from "../../../../cases/detail/header/case-header-overlays.module.css";

export function DefectReportDates({ createdAt, archivedAt }: { createdAt: string; archivedAt?: string | null }) {
  const { locale, languageTag, t } = useTmsLocale();
  const [open, setOpen] = useState(false);
  const wasOpenBeforeTouch = useRef(false);
  const ru = locale === "ru";
  const format = new Intl.DateTimeFormat(languageTag, { dateStyle: "medium", timeStyle: "short" });
  return <Tooltip isOpen={open} onOpenChange={setOpen} placement="bottom-end" offset={5} delay={350} closeDelay={60}
    disableAnimation classNames={{ base: overlays.positioner, content: overlays.dates }}
    content={<dl>
      <div><dt>{t("reports.created")}</dt><dd><time dateTime={createdAt}>{format.format(new Date(createdAt))}</time></dd></div>
      {archivedAt && <div><dt>{ru ? "В архиве с" : "Archived on"}</dt>
        <dd><time dateTime={archivedAt}>{format.format(new Date(archivedAt))}</time></dd></div>}
    </dl>}>
    <Button type="button" isIconOnly variant="light" disableRipple className={overlays.dateTrigger}
      aria-label={ru ? "Даты баг-репорта" : "Bug report dates"}
      onPointerDownCapture={event => { if (event.pointerType === "touch") wasOpenBeforeTouch.current = open; }}
      onPress={event => { if (event.pointerType === "touch") setOpen(!wasOpenBeforeTouch.current); }}>
      <Info size={15} aria-hidden="true" />
    </Button>
  </Tooltip>;
}
