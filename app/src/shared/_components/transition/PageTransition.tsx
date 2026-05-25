// components/shared/transition/PageTransition.tsx
'use client';
import { Children, cloneElement, isValidElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const child = Children.only(children);
  return (
    <AnimatePresence mode="wait">
      {isValidElement(child) ? (
        <motion.div
          key={(child as any).key ?? 'page'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {cloneElement(child as any, {
            // ВАЖНО: МЕРЖИМ, а не затираем
            className: [ (child as any).props?.className ].filter(Boolean).join(' ')
          })}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
