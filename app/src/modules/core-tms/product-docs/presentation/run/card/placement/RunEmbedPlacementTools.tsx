"use client";

import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { AlignCenter, AlignLeft, AlignRight, Check, ChevronDown, Columns3, PanelLeft, PanelRight, StretchHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import { toolbarMenuMotion } from "../../../draft/toolbar/menu/ProductDocToolbarMenu";
import menu from "../../../draft/toolbar/menu/toolbar-menu.module.css";
import { ProductDocTooltip } from "../../../overlay/ProductDocTooltip";
import { maxRunEmbedWidth, minRunEmbedWidth, type RunEmbedPlacement } from "../../markdown/runDirective";
import { clampRunEmbedWidth, resizeRunEmbedWidth } from "./runEmbedResize";
import styles from "./run-embed-placement.module.css";

type Alignment = NonNullable<RunEmbedPlacement["align"]>;
type Drag = {
  element: HTMLElement; initialStyle: string; pointerId: number; x: number;
  width: number; available: number; alignment: Alignment;
};

const widthProperty = "--run-embed-width";
const alignments = [
  { value: "left", Icon: AlignLeft, Compose: PanelLeft, en: "Align left", ru: "По левому краю", besideEn: "Text on the right", besideRu: "Текст справа" },
  { value: "center", Icon: AlignCenter, Compose: Columns3, en: "Center", ru: "По центру", besideEn: "Text on both sides", besideRu: "Текст по обе стороны" },
  { value: "right", Icon: AlignRight, Compose: PanelRight, en: "Align right", ru: "По правому краю", besideEn: "Text on the left", besideRu: "Текст слева" },
] as const;

function restoreWidth(drag: Drag) { drag.element.style.setProperty(widthProperty, drag.initialStyle); }

function frameBounds(element: HTMLElement | null) {
  const track = element?.parentElement;
  if (!element || !track) return null;
  const style = window.getComputedStyle(track);
  const available = track.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  return available > 0 ? { available, width: element.getBoundingClientRect().width } : null;
}

export function RunEmbedPlacementTools({ placement, onChange, onRemove, onCompose, frame, ru }: {
  placement?: RunEmbedPlacement;
  onChange(placement: RunEmbedPlacement): void;
  onRemove(): void;
  onCompose?(alignment: Alignment): void;
  frame: RefObject<HTMLElement | null>;
  ru: boolean;
}) {
  const align = placement?.align ?? "left";
  const drag = useRef<Drag>(null);
  const pendingCompose = useRef<Alignment>(null);
  const [autoWidth, setAutoWidth] = useState(maxRunEmbedWidth);
  const [preview, setPreview] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = useReducedMotion();
  const placementLabel = ru ? "Размещение прогона" : "Run placement";
  const resizeLabel = ru ? "Ширина снимка прогона" : "Run snapshot width";
  const removeLabel = ru ? "Убрать снимок прогона" : "Remove run snapshot";
  const fullLabel = ru ? "На всю ширину" : "Full width";
  const ActiveIcon = alignments.find((item) => item.value === align)?.Icon ?? AlignLeft;
  const width = placement?.width ?? autoWidth;

  useEffect(() => () => { if (drag.current) restoreWidth(drag.current); pendingCompose.current = null; }, []);
  useEffect(() => {
    const element = frame.current;
    const track = element?.parentElement;
    if (placement?.width !== undefined || !element || !track) return;
    function update() {
      const bounds = frameBounds(element);
      if (bounds && !drag.current) setAutoWidth(clampRunEmbedWidth(bounds.width / bounds.available * 100));
    }
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(track);
    observer.observe(element);
    return () => observer.disconnect();
  }, [frame, placement?.width]);

  function start(event: PointerEvent<HTMLDivElement>) {
    const element = frame.current;
    if (event.button !== 0 || drag.current || !element) return;
    const bounds = frameBounds(element);
    if (!bounds) return;
    event.preventDefault();
    event.stopPropagation();
    drag.current = { element, initialStyle: element.style.getPropertyValue(widthProperty),
      pointerId: event.pointerId, x: event.clientX, ...bounds, alignment: align };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
  }

  function live(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const value = resizeRunEmbedWidth(current.width, current.available, event.clientX - current.x, current.alignment);
    current.element.style.setProperty(widthProperty, `${value}%`);
    setPreview(value);
  }

  function finish(event: PointerEvent<HTMLDivElement>, commit: boolean) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    restoreWidth(current);
    setPreview(null);
    if (commit && Math.abs(event.clientX - current.x) >= 2) {
      const next = resizeRunEmbedWidth(current.width, current.available, event.clientX - current.x, current.alignment);
      if (next !== clampRunEmbedWidth(current.width / current.available * 100)) onChange({ ...placement, width: next });
    }
  }

  function composeAfterClose() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const alignment = pendingCompose.current;
      pendingCompose.current = null;
      if (alignment) onCompose?.(alignment);
    }));
  }

  return <>
    <div className={styles.tools} data-menu-open={menuOpen || undefined} contentEditable={false}
      onMouseDown={(event) => event.preventDefault()}>
      <Dropdown placement="bottom-end" offset={6} containerPadding={10} shouldBlockScroll={false} shouldCloseOnScroll={false}
        onOpenChange={(open) => { setMenuOpen(open); if (!open && reduced) composeAfterClose(); }}
        disableAnimation={Boolean(reduced)} motionProps={{ variants: toolbarMenuMotion,
          onAnimationComplete: (variant) => { if (variant === "exit") composeAfterClose(); } }}
        classNames={{ base: menu.positioner, content: menu.surface }} style={{ zIndex: 160 }}>
        <DropdownTrigger>
          <Button type="button" size="sm" variant="light" disableRipple className={styles.placement}
            aria-label={placementLabel} title={placementLabel}>
            <ActiveIcon size={15} aria-hidden="true" /><ChevronDown size={10} aria-hidden="true" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label={placementLabel} data-editor-dialog classNames={{ base: menu.viewport, list: menu.list }}
          itemClasses={{ base: `${menu.item} ${styles.item}`, title: styles.label }}
          onAction={(key) => {
            if (key === "full") {
              if (placement?.width !== maxRunEmbedWidth) onChange({ ...placement, width: maxRunEmbedWidth });
              return;
            }
            const item = alignments.find(({ value }) => key === value || key === `beside-${value}`);
            if (!item) return;
            if (key === item.value) onChange({ ...placement, align: item.value });
            else pendingCompose.current = item.value;
          }}>
          {[<DropdownSection key="position" aria-label={ru ? "Положение блока" : "Block position"} classNames={{ group: menu.list }}
            showDivider={Boolean(onCompose)} className={styles.section}>
            {[
              ...alignments.map(({ value, Icon, en, ru: labelRu }) => <DropdownItem key={value}
                textValue={ru ? labelRu : en} aria-current={value === align || undefined}
                startContent={<Icon size={15} aria-hidden="true" />}
                endContent={value === align ? <Check size={14} aria-hidden="true" /> : undefined}>
                {ru ? labelRu : en}
              </DropdownItem>),
              <DropdownItem key="full" textValue={fullLabel} aria-current={placement?.width === maxRunEmbedWidth || undefined}
                startContent={<StretchHorizontal size={15} aria-hidden="true" />}
                endContent={placement?.width === maxRunEmbedWidth ? <Check size={14} aria-hidden="true" /> : undefined}>
                {fullLabel}
              </DropdownItem>,
            ]}
          </DropdownSection>,
          ...(onCompose ? [<DropdownSection key="compose" title={ru ? "Текст рядом с прогоном" : "Text beside run"}
            classNames={{ heading: styles.heading, group: menu.list }} className={styles.section}>
            {alignments.map(({ value, Compose, besideEn, besideRu }) => <DropdownItem key={`beside-${value}`}
              textValue={ru ? besideRu : besideEn} startContent={<Compose size={15} aria-hidden="true" />}>
              {ru ? besideRu : besideEn}
            </DropdownItem>)}
          </DropdownSection>] : [])]}
        </DropdownMenu>
      </Dropdown>
      <ProductDocTooltip label={removeLabel}><Button type="button" size="sm" variant="light" isIconOnly disableRipple
        className={styles.remove} aria-label={removeLabel} onPress={onRemove}><X size={15} aria-hidden="true" /></Button></ProductDocTooltip>
    </div>
    <div role="slider" tabIndex={0} contentEditable={false} className={styles.grip} title={resizeLabel}
      aria-label={resizeLabel} aria-valuemin={minRunEmbedWidth} aria-valuemax={maxRunEmbedWidth}
      aria-valuenow={preview ?? width} aria-valuetext={`${preview ?? width}%`}
      data-edge={align === "right" ? "start" : "end"} data-resizing={preview !== null || undefined}
      onPointerDown={start} onPointerMove={live} onPointerUp={(event) => finish(event, true)}
      onPointerCancel={(event) => finish(event, false)} onLostPointerCapture={(event) => finish(event, false)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && drag.current) {
          event.preventDefault(); event.stopPropagation();
          const current = drag.current;
          drag.current = null;
          restoreWidth(current); setPreview(null);
          event.currentTarget.releasePointerCapture(current.pointerId);
          return;
        }
        const step = event.shiftKey ? 10 : 5;
        const values = { ArrowLeft: width - step, ArrowRight: width + step, ArrowDown: width - step,
          ArrowUp: width + step, Home: minRunEmbedWidth, End: maxRunEmbedWidth };
        if (!(event.key in values) || drag.current) return;
        event.preventDefault(); event.stopPropagation();
        const next = clampRunEmbedWidth(values[event.key as keyof typeof values]);
        if (next !== width) onChange({ ...placement, width: next });
      }}>
      {preview !== null && <span aria-hidden="true" className={styles.percent}>{preview}%</span>}
    </div>
  </>;
}
