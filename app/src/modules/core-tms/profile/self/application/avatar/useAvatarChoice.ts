import { useEffect, useRef, useState } from "react";
import { avatarCharacter } from "../../../avatars/content/avatar-characters";

type Options = { currentCharacterId: string | null; hasPhoto: boolean; onSave: (id: string) => Promise<boolean>;
  onUpload: (file: File) => Promise<boolean>; onClose: () => void };
export function useAvatarChoice(options: Options) {
  const initial = options.hasPhoto ? null : avatarCharacter(options.currentCharacterId)?.id ?? null;
  const [selected, setSelected] = useState<string | null>(initial), [working, setWorking] = useState(false);
  const busy = useRef(false), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const execute = async (operation: () => Promise<boolean>) => {
    if (busy.current) return;
    busy.current = true; setWorking(true);
    try { if (await operation() && alive.current) options.onClose(); }
    finally { busy.current = false; if (alive.current) setWorking(false); }
  };
  return { selected, working, changed: selected !== null && selected !== initial,
    select: (id: string) => { if (!busy.current && avatarCharacter(id)) setSelected(id); },
    save: () => selected !== null && selected !== initial ? execute(() => options.onSave(selected)) : Promise.resolve(),
    upload: (file: File) => execute(() => options.onUpload(file)),
  };
}
