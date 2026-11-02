import { useEffect, useState, type RefObject } from "react";

export function useSidebarVisibility(sidebar: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = sidebar.current;
    if (!element) return;
    let active = true;
    const measure = () => { if (active) setVisible(element.getBoundingClientRect().width > 0); };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener("resize", measure);
    return () => { active = false; observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [sidebar]);
  return visible;
}
