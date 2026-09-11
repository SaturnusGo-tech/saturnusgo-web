import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import css from "./toast.module.css";

export function SupportToast({ receiptId, ru, onDismiss }: {
  receiptId: string | null; ru: boolean; onDismiss: () => void;
}) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!receiptId) return;
    const timer = window.setTimeout(onDismiss, 10_000);
    return () => window.clearTimeout(timer);
  }, [receiptId, onDismiss]);
  return <div className={css.region} data-support-overlay>
    <AnimatePresence>
      {receiptId && <motion.div key={receiptId} className={css.toast} role="status" aria-atomic="true"
        initial={{ opacity: 0, x: reduced ? 0 : -40 }} animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: reduced ? 0 : 80 }} transition={{ duration: reduced ? 0 : .24, ease: [.22, 1, .36, 1] }}
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={.7} dragSnapToOrigin
        onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 55 || Math.abs(info.velocity.x) > 450) onDismiss(); }}>
        <CheckCircle2 size={19} aria-hidden="true" />
        <p><strong>{ru ? "Обращение успешно принято." : "Your request has been received."}</strong>
          <span>{ru ? "Мы ответим на вашу почту, указанную в профиле." : "We will reply to the email address in your profile."}</span></p>
        <button type="button" onClick={onDismiss} aria-label={ru ? "Закрыть уведомление" : "Dismiss notification"}><X size={15} /></button>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
