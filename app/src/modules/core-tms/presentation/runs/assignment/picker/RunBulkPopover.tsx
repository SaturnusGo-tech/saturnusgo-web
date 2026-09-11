import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { FilterTransition } from "../../../cases/toolbar/filter/FilterTransition";
import css from "../run-assignment.module.css";
export function RunBulkPopover({open,children}:{open:boolean;children:ReactNode}) {
  const reduced=useReducedMotion();
  return <AnimatePresence>{open&&<motion.div className={css.picker}
    initial={{opacity:0,y:reduced?0:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduced?0:4}}
    transition={{duration:reduced?0:.2,ease:[.22,.61,.36,1]}}>
    <FilterTransition view="picker">{children}</FilterTransition>
  </motion.div>}</AnimatePresence>;
}
