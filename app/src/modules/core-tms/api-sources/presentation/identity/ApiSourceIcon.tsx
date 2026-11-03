import { Braces } from "lucide-react";
import css from "./identity.module.css";

/** Source identity stays the same when the catalog is sorted or renamed. */
export function ApiSourceIcon({ id, size = 24 }: { id?: string; size?: number }) {
  let hash = 2166136261;
  for (const character of id ?? "") hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  return <Braces className={`${css.icon} ${id ? css[`tone${hash % 5}`] : css.neutral}`} size={size} strokeWidth={1.6} aria-hidden="true" />;
}
