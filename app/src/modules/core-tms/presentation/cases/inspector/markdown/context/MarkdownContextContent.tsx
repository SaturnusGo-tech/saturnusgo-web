import { createContext, useContext, type ReactNode } from "react";

/** Read-only context rendered between the formatting toolbar and the editable document. */
export const MarkdownContextContent = createContext<ReactNode>(null);
export function MarkdownContextArea() {
  return <>{useContext(MarkdownContextContent)}</>;
}
