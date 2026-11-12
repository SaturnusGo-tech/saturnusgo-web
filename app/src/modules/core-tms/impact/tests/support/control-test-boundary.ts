// Presentation contract tests use intrinsic hosts at the ready UI boundary.
// Real integration wrappers, state, commands and ports remain under test.
export function installIntegrationTestControls(): () => void {
  const loader = require("node:module") as { _load: (name: string, parent: NodeModule | undefined, main?: boolean) => unknown };
  const previous = loader._load;
  const controls = { Button: "button", Input: "input", Textarea: "textarea", Checkbox: "input", Switch: "input", Select: "select", SelectItem: "option" };
  loader._load = function(name, parent, main) {
    return name === "@heroui/react" ? controls : previous.call(this, name, parent, main);
  };
  return () => { loader._load = previous; };
}
