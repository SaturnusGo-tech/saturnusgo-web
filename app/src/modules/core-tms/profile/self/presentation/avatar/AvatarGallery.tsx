import { Check } from "lucide-react";
import { useId } from "react";
import { avatarCharacters } from "../../../avatars/content/avatar-characters";
import styles from "./avatar-chooser.module.css";

export function AvatarGallery({ selected, disabled, ru, onSelect }: {
  selected: string | null; disabled: boolean; ru: boolean; onSelect: (id: string) => void;
}) {
  const group = useId();
  return <fieldset className={styles.gallery} disabled={disabled}>
    <legend className={styles.srOnly}>{ru ? "Персонажи Falcon" : "Falcon characters"}</legend>
    {avatarCharacters.map(character => <label className={styles.character} key={character.id} data-selected={selected === character.id || undefined}>
      <input type="radio" name={group} value={character.id} checked={selected === character.id} onChange={() => onSelect(character.id)} />
      <span className={styles.portrait}><img src={character.image} alt="" width={144} height={144} draggable={false} />
        {selected === character.id && <span className={styles.check}><Check size={18} strokeWidth={2.6} aria-hidden="true" /></span>}
      </span><span className={styles.name}>{ru ? character.nameRu : character.name}</span>
    </label>)}
  </fieldset>;
}
