// Source: https://raw.githubusercontent.com/ibelick/motion-primitives/main/components/core/transition-panel.tsx
// MIT Copyright (c) 2024 ibelick; see ./motion-primitives-LICENSE.txt.
// Adapted from TypeScript to JSX; clsx and an inline relative wrapper replace Tailwind utilities.
'use client';
import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import clsx from 'clsx';

export function TransitionPanel({
  children,
  className,
  transition,
  variants,
  activeIndex,
  ...motionProps
}) {
  return (
    <div className={clsx(className)} style={{ position: 'relative' }}>
      <AnimatePresence
        initial={false}
        mode='popLayout'
        custom={motionProps.custom}
      >
        <motion.div
          key={activeIndex}
          variants={variants}
          transition={transition}
          initial='enter'
          animate='center'
          exit='exit'
          {...motionProps}
        >
          {children[activeIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
