import { Moon, Sun } from "lucide-react";
import { useColorMode } from "../../../../../../shared/_hooks/useColorMode";

export function IntegrationThemeToggle({ russian, className }: { russian: boolean; className: string }) {
  const { isLight, toggleAnimated } = useColorMode();
  const label = isLight ? (russian ? "Включить тёмную тему" : "Switch to dark theme")
    : (russian ? "Включить светлую тему" : "Switch to light theme");
  return <button type="button" className={className} aria-label={label} title={label}
    onClick={(event) => toggleAnimated({ x: event.clientX, y: event.clientY })}>
    {isLight ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
  </button>;
}
