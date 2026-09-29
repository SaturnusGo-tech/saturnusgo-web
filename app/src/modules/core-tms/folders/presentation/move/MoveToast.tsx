import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { FolderResource } from "../../model/folder";
import css from "./move-toast.module.css";

export function MoveToast({ resource, ru, raised = false }: { resource: FolderResource; ru: boolean; raised?: boolean }) {
  const receipt = resource.lastMove;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const reduce = useReducedMotion();
  useEffect(() => { setError(""); }, [receipt?.id]);
  useEffect(() => {
    if (!receipt || pending) return;
    const timer = setTimeout(() => resource.dismissMove?.(receipt.id), Math.max(0, receipt.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [receipt?.id, receipt?.expiresAt, pending, resource.dismissMove]);
  async function undo() {
    if (!receipt || pending || !resource.undoMove) return;
    setPending(true); setError("");
    try { const result = await resource.undoMove(receipt.id); if (!result.ok) setError(result.message); }
    catch { setError(ru ? "Не удалось отменить перенос." : "Could not undo the move."); }
    finally { setPending(false); }
  }
  if (typeof document === "undefined") return null;
  return createPortal(<AnimatePresence>{receipt && <motion.div key={receipt.id} className={css.toast} data-raised={raised || undefined}
    initial={{ opacity: 0, x: reduce ? 0 : 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : 24 }}
    transition={{ duration: reduce ? 0 : .22, ease: [.22, .61, .36, 1] }}>
    <Check size={18} aria-hidden="true"/>
    <span role={error ? "alert" : "status"}>{error || (ru ? `Перенесено тест-кейсов: ${receipt.count}` : `Test cases moved: ${receipt.count}`)}</span>
    <button type="button" disabled={pending || resource.busy} onClick={() => void undo()}>{pending ? (ru ? "Возвращаем…" : "Restoring…") : (ru ? "Отменить" : "Undo")}</button>
    <button type="button" className={css.close} disabled={pending} aria-label={ru ? "Закрыть" : "Dismiss"} onClick={() => resource.dismissMove?.(receipt.id)}><X size={15}/></button>
  </motion.div>}</AnimatePresence>, document.body);
}
