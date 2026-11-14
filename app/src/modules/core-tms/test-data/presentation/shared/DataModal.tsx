import { createPortal } from "react-dom";
import type { ComponentProps } from "react";
import { Modal } from "../../../presentation/common/modal/Modal";
import css from "./data.module.css";
/** Keep feature forms outside the case form and isolate React submit bubbling through the portal. */
export function DataModal(props: ComponentProps<typeof Modal>) {
  const content = <div onSubmit={event => event.stopPropagation()} onKeyDown={event => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault(); event.stopPropagation(); props.onClose();
  }}><Modal {...props} panelClassName={`${css.dialog} ${props.panelClassName ?? ""}`} /></div>;
  return typeof document === "undefined" ? content : createPortal(content, document.body);
}
