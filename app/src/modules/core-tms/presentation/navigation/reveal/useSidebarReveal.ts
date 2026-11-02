import { useEffect, useRef, useState, type RefObject } from "react";

/** Hover peeks without saving; deliberate drags pin the same width into the layout. */
export function useSidebarReveal(root: RefObject<HTMLElement | null>, collapsed: boolean, onCollapsedChange: (next: boolean) => void) {
  const [revealed, setRevealed] = useState(false), current = useRef({ collapsed, onCollapsedChange });
  const actions = useRef({ dismiss: () => {}, setCollapsed: (_next: boolean) => {} });
  useEffect(() => { current.current = { collapsed, onCollapsedChange }; }, [collapsed, onCollapsedChange]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let shown = false, suppressed = false, touch = false, blockClick = false, fromPointer = false, independentHovered = false;
    let opening: ReturnType<typeof setTimeout> | undefined, closing: ReturnType<typeof setTimeout> | undefined, pressing: ReturnType<typeof setTimeout> | undefined;
    let gesture: { x: number; y: number; id: number; horizontal: boolean; armed: boolean; capture?: HTMLElement } | null = null;
    const clearOpening = () => { clearTimeout(opening); opening = undefined; };
    const clearClosing = () => { clearTimeout(closing); closing = undefined; };
    const cancelGesture = () => {
      clearTimeout(pressing); pressing = undefined;
      if (gesture?.capture?.hasPointerCapture(gesture.id)) gesture.capture.releasePointerCapture(gesture.id);
      gesture = null;
    };
    const independent = (target: EventTarget | null) => !!target && (!!(target as Element)?.closest?.("[data-sidebar-independent]")
      || Array.from(element.querySelectorAll('[data-sidebar-independent] [aria-expanded="true"][aria-controls]')).some(trigger => {
        const id = trigger.getAttribute("aria-controls");
        return !!id && document.getElementById(id)?.contains(target as Node);
      }));
    const owns = (target: EventTarget | null) => !!target && (element.contains(target as Node)
      || Array.from(element.querySelectorAll('[aria-expanded="true"][aria-controls]')).some(trigger => {
        const id = trigger.getAttribute("aria-controls");
        return !!id && document.getElementById(id)?.contains(target as Node);
      }));
    const hide = () => { clearOpening(); clearClosing(); shown = false; setRevealed(false); };
    const change = (next: boolean) => {
      hide(); suppressed = next;
      if (current.current.collapsed !== next) current.current.onCollapsedChange(next);
    };
    actions.current = { dismiss: () => { hide(); suppressed = true; }, setCollapsed: change };
    const show = () => { clearOpening(); clearClosing(); if (current.current.collapsed) { shown = true; setRevealed(true); } };
    const edgeFor = (target: EventTarget | null) => (target as Element | null)?.closest?.<HTMLElement>("[data-sidebar-resize]");
    const enter = (event: PointerEvent) => {
      if (independentHovered || independent(event.target)) { hide(); return; }
      const right = element.getBoundingClientRect?.().right;
      if (edgeFor(event.target) || gesture || (right !== undefined && event.clientX >= right - 8)) { clearOpening(); return; }
      if (event.pointerType === "touch" || suppressed || !current.current.collapsed || window.innerWidth <= 760) return;
      fromPointer = true; clearClosing();
      if (!shown && !opening) opening = setTimeout(show, 120);
    };
    const leave = (event: PointerEvent) => {
      suppressed = false; independentHovered = false; clearOpening();
      if (owns(event.relatedTarget) || (!fromPointer && owns(document.activeElement))) return;
      clearClosing(); closing = setTimeout(hide, 200);
    };
    const over = (event: PointerEvent) => {
      independentHovered = independent(event.target);
      if (independentHovered) hide(); else if (edgeFor(event.target)) clearOpening(); else enter(event);
    };
    const focus = (event: FocusEvent) => {
      if (independent(event.target)) { hide(); return; }
      if (!edgeFor(event.target) && !gesture && !touch && !suppressed && window.innerWidth > 760) show();
    };
    const blur = (event: FocusEvent) => { if (!owns(event.relatedTarget)) { clearClosing(); closing = setTimeout(hide, 200); } };
    const outside = (event: Event) => { if (independent(event.target) || (shown && !owns(event.target))) hide(); };
    const pointerOver = (event: PointerEvent) => {
      if (independent(event.target)) { hide(); return; }
      if (!shown) return;
      if (owns(event.target)) clearClosing();
      else if (fromPointer) { clearClosing(); closing = setTimeout(hide, 200); }
    };
    const keydown = (event: KeyboardEvent) => {
      touch = false; fromPointer = false;
      if (event.key !== "Escape" || event.defaultPrevented || independent(event.target) || independent(document.activeElement)) return;
      const navigationOwnsEvent = owns(event.target) || owns(document.activeElement);
      if (!shown && !navigationOwnsEvent) return;
      if (!current.current.collapsed && navigationOwnsEvent) change(true);
      else { hide(); suppressed = true; }
    };
    const down = (event: PointerEvent) => {
      touch = event.pointerType === "touch"; fromPointer = true; blockClick = false; cancelGesture(); clearOpening();
      if (independent(event.target)) { hide(); return; }
      if (!event.isPrimary || event.button !== 0 || window.innerWidth <= 760
        || (event.target as Element | null)?.closest?.("input, textarea, select, [contenteditable=true]")) return;
      const capture = edgeFor(event.target) ?? undefined;
      gesture = { x: event.clientX, y: event.clientY, id: event.pointerId, horizontal: false, armed: !!capture, capture };
      if (capture) { event.preventDefault(); capture.setPointerCapture(event.pointerId); }
      else pressing = setTimeout(() => { if (gesture) gesture.armed = true; }, 180);
    };
    const move = (event: PointerEvent) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (!gesture.horizontal && Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) { cancelGesture(); return; }
      if (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 1.4) gesture.horizontal = true;
      if (gesture.horizontal && gesture.armed) event.preventDefault();
    };
    const up = (event: PointerEvent) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      if (gesture.horizontal) { blockClick = true; if (gesture.armed && Math.abs(dx) >= 48) change(dx < 0); }
      cancelGesture();
    };
    const click = (event: MouseEvent) => { if (blockClick) { event.preventDefault(); event.stopImmediatePropagation(); blockClick = false; } };
    const forcePress = (event: Event) => event.preventDefault();
    const windowBlur = () => { cancelGesture(); hide(); };
    const resize = () => { if (window.innerWidth <= 760) hide(); };
    element.addEventListener("pointerenter", enter); element.addEventListener("pointerleave", leave); element.addEventListener("pointerover", over);
    element.addEventListener("focusin", focus); element.addEventListener("focusout", blur); element.addEventListener("pointerdown", down);
    element.addEventListener("click", click, true); element.addEventListener("webkitmouseforcewillbegin", forcePress);
    document.addEventListener("keydown", keydown); document.addEventListener("pointerdown", outside); document.addEventListener("focusin", outside);
    document.addEventListener("pointerover", pointerOver);
    window.addEventListener("pointermove", move, { passive: false }); window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancelGesture); window.addEventListener("blur", windowBlur); window.addEventListener("resize", resize);
    return () => {
      clearOpening(); clearClosing(); cancelGesture(); actions.current = { dismiss: () => {}, setCollapsed: () => {} };
      element.removeEventListener("pointerenter", enter); element.removeEventListener("pointerleave", leave); element.removeEventListener("pointerover", over);
      element.removeEventListener("focusin", focus); element.removeEventListener("focusout", blur); element.removeEventListener("pointerdown", down);
      element.removeEventListener("click", click, true); element.removeEventListener("webkitmouseforcewillbegin", forcePress);
      document.removeEventListener("keydown", keydown); document.removeEventListener("pointerdown", outside); document.removeEventListener("focusin", outside);
      document.removeEventListener("pointerover", pointerOver);
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancelGesture); window.removeEventListener("blur", windowBlur); window.removeEventListener("resize", resize);
    };
  }, [root]);
  return { revealed: collapsed && revealed, dismiss: () => actions.current.dismiss(), setCollapsed: (next: boolean) => actions.current.setCollapsed(next) };
}
