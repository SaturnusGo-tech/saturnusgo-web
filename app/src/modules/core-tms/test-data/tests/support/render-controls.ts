// Component interaction tests isolate browser-owned focus/portals. Real HeroUI behavior is browser-verified separately.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export function installRenderControls(options: { portals?: boolean } = {}) {
  const loader = require("node:module") as { _load: (name: string, parent: NodeModule | undefined, main?: boolean) => unknown };
  const previous = loader._load, css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const controls = { Button: "button", Input: "input", Textarea: "textarea", Select: "select", SelectItem: "option", Switch: "switch", Skeleton: "skeleton",
    Popover: "popover", PopoverTrigger: "trigger", PopoverContent: "popup", Listbox: "listbox", ListboxItem: "option" };
  loader._load = function(name, parent, main) {
    if (name === "@heroui/react") return controls;
    if (name === "react-dom" && options.portals) return { createPortal: (children: unknown) => children };
    if (name.endsWith("/select/AnchoredSelect")) return { AnchoredSelect: "select" };
    if (name.endsWith("/popover/AnchoredPopover")) return { AnchoredPopover: "popover" };
    if (name.endsWith("/modal/Modal")) return { Modal: "dialog" };
    if (name.endsWith("/useFormLeave")) return { useFormLeave: () => ({ close: (action: () => void) => action(), release() {}, reset() {} }) };
    return previous.call(this, name, parent, main);
  };
  return () => { loader._load = previous; if (css) require.extensions[".css"] = css; else delete require.extensions[".css"]; };
}
