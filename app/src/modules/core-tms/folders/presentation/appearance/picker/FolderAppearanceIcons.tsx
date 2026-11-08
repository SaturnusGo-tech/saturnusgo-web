import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import type { FolderIconId } from "../../../model/appearance/folder-appearance";
import { folderPalette } from "../../../model/appearance/folder-appearance";
import type { FolderPickerEditor } from "./FolderAppearancePicker";
import { folderIcons } from "../icons/folder-icons";
import visualStyles from "../visual/folder-visual.module.css";
import css from "./appearance-picker.module.css";

export function FolderAppearanceIcons({ editor, ru, defaultIcon = "folder", defaultColor = "var(--falcon-folder)" }: {
  editor: FolderPickerEditor; ru: boolean; defaultIcon?: FolderIconId; defaultColor?: string;
}) {
  const appearance = editor.preview, id = appearance?.kind === "icon" ? appearance.iconId : defaultIcon;
  const color = appearance?.kind === "icon" ? appearance.color : null, effective = color ?? "#5797F6";
  const [hex, setHex] = useState(effective);
  const latest = useRef(hex), dragging = useRef(false), grid = useRef<HTMLDivElement>(null); latest.current = hex;
  function choose(iconId: FolderIconId, value = color) { editor.choose({ kind: "icon", iconId, color: value }); }
  function commit(value: string) { if (/^#[a-fA-F0-9]{6}$/.test(value)) { setHex(value); choose(id, value); } }
  useEffect(() => { setHex(effective); }, [effective]);
  useEffect(() => {
    const finish = () => { if (dragging.current) { dragging.current = false; commit(latest.current); } };
    window.addEventListener("pointerup", finish, true); window.addEventListener("pointercancel", finish, true);
    return () => { window.removeEventListener("pointerup", finish, true); window.removeEventListener("pointercancel", finish, true); };
  }, [id]);
  useEffect(() => { grid.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" }); }, [id]);
  return <>
    <div className={css.hex}><span>{ru ? "Свой цвет" : "Custom color"}</span><label>HEX <input aria-label={ru ? "Цвет HEX" : "HEX color"}
      value={hex} aria-invalid={!/^#[a-fA-F0-9]{6}$/.test(hex)} maxLength={7} onChange={event => setHex(event.target.value)}
      onBlur={() => commit(hex)} onKeyDown={event => { if (event.key === "Enter") commit(hex); }} /></label></div>
    <div className={css.colorPicker} onPointerDownCapture={() => { dragging.current = true; }} onKeyUp={() => commit(latest.current)}>
      <HexColorPicker color={/^#[a-fA-F0-9]{6}$/.test(hex) ? hex : effective} onChange={value => { latest.current = value; setHex(value); editor.previewColor({ kind: "icon", iconId: id, color: value }); }} />
    </div>
    <div ref={grid} className={css.icons} data-icon-rows={3} onKeyDown={event => {
      const offset = ({ ArrowLeft: -3, ArrowRight: 3, ArrowUp: -1, ArrowDown: 1 } as Record<string, number>)[event.key];
      if (offset === undefined && event.key !== "Home" && event.key !== "End") return;
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
      const at = buttons.indexOf(event.target as HTMLButtonElement); if (at < 0) return;
      event.preventDefault(); buttons[event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (at + (offset ?? 0) + buttons.length) % buttons.length]?.focus();
    }} aria-label={ru ? "Иконки папки" : "Folder icons"}>
      {(Object.keys(folderIcons) as FolderIconId[]).map(iconId => { const Icon = folderIcons[iconId]; return <button key={iconId}
        type="button" tabIndex={id === iconId ? 0 : -1} aria-label={iconId === "folder" ? (ru ? "Стандартная папка" : "Default folder") : iconId}
        aria-pressed={id === iconId && (!appearance || appearance.kind === "icon")} title={iconId} onClick={() => choose(iconId)}
        style={{ color: color ?? defaultColor }}><Icon size={22} className={color ? visualStyles.tintedIcon : undefined} /></button>; })}
    </div>
    <div className={css.palette} aria-label={ru ? "Цвет иконки" : "Icon color"}>
      <button type="button" className={css.defaultColor} aria-label={ru ? "Стандартный цвет" : "Default color"} aria-pressed={color === null}
        onClick={() => choose(id, null)}>A</button>
      {folderPalette.map(value => <button type="button" key={value} aria-label={value} aria-pressed={color?.toUpperCase() === value}
        style={{ backgroundColor: value }} onClick={() => { setHex(value); choose(id, value); }} />)}
    </div>
  </>;
}
