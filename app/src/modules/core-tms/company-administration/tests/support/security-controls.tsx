import { Button } from "./controls/form/Button";
import { Checkbox } from "./controls/form/Checkbox";
import { Modal } from "./controls/dialog/Modal";
import { ModalContent } from "./controls/dialog-content/ModalContent";
import { ModalBody } from "./controls/dialog-content/ModalBody";
import { ModalHeader } from "./controls/dialog-chrome/ModalHeader";
import { ModalFooter } from "./controls/dialog-chrome/ModalFooter";
import { LoadingOrb } from "./controls/feedback/LoadingOrb";

// Contract-test boundary only. Real HeroUI focus/portal/interaction behavior is browser-verified.
const controls = { Button, Checkbox, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter };

export function installSecurityControls(): () => void {
  const loader = require("node:module") as { _load: (name: string, parent: NodeModule | undefined, main?: boolean) => unknown };
  const previous = loader._load, css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  loader._load = function (name, parent, main) {
    if (name === "@heroui/react") return controls;
    if (name.endsWith("/LoadingOrb")) return { LoadingOrb };
    return previous.call(this, name, parent, main);
  };
  return () => { loader._load = previous; if (css) require.extensions[".css"] = css; else delete require.extensions[".css"]; };
}
