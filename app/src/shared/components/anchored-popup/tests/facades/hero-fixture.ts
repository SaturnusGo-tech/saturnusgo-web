let reducedMotion = false;
export function setReducedMotion(value: boolean): void { reducedMotion = value; }

export function installHeroFixture(): () => void {
  const loader = require("node:module") as { _load: (name: string, parent: NodeModule | undefined, main?: boolean) => unknown };
  const previous = loader._load;
  loader._load = function (name, parent, main) {
    if (name === "framer-motion") return { useReducedMotion: () => reducedMotion };
    if (name === "@heroui/react") return { Select: "hero-select", Autocomplete: "hero-autocomplete", Dropdown: "hero-dropdown", Popover: "hero-popover" };
    if (name === "@heroui/popover") return { FreeSoloPopover: "hero-free-solo" };
    return previous.call(this, name, parent, main);
  };
  return () => { loader._load = previous; };
}
