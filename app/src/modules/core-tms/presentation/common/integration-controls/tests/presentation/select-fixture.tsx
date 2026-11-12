import React from "react";

let reducedMotion = false;
export function setSelectReducedMotion(value: boolean): void { reducedMotion = value; }

function Select(props: { children?: React.ReactNode }) {
  return React.createElement("div", { ...props, "data-test-select": true }, props.children);
}

export function installSelectFixture(): () => void {
  const loader = require("node:module") as { _load: (name: string, parent: NodeModule | undefined, main?: boolean) => unknown };
  const previous = loader._load, previousCss = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  loader._load = function (name, parent, main) {
    if (name === "framer-motion") return { useReducedMotion: () => reducedMotion };
    return name === "@heroui/react" ? { Select, SelectItem: "option", Button: "button" } : previous.call(this, name, parent, main);
  };
  return () => {
    loader._load = previous;
    if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
  };
}
