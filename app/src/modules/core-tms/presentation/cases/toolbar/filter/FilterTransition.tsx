import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export function FilterTransition({ view, children }: { view: string; children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  const reduced = useReducedMotion();
  useLayoutEffect(() => {
    const node = content.current;
    if (!node) return;
    const measure = () => setHeight(node.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [view]);
  return <motion.div initial={false} animate={{ height }} style={{ position: "relative", overflow: "hidden" }}
    transition={{ duration: reduced ? 0 : .22, ease: [.22, .61, .36, 1] }}>
    <AnimatePresence initial={false} mode="popLayout">
      <motion.div key={view} ref={content} data-filter-view={view}
        initial={{ opacity: reduced ? 1 : 0, x: reduced ? 0 : view === "root" ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduced ? 0 : view === "root" ? -10 : 10 }}
        transition={{ duration: reduced ? 0 : .16 }}>
        {children}
      </motion.div>
    </AnimatePresence>
  </motion.div>;
}
