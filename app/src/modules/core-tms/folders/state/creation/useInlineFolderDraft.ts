import { useEffect, useRef, useState } from "react";
import type { RepositoryCreation } from "../../model/creation/repository-creation";

export function useInlineFolderDraft(parentId: string, creation: RepositoryCreation, disabled: boolean, ru: boolean) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function save() {
    const value = name.trim();
    if (!value || disabled || pending.current) return false;
    pending.current = true; setSaving(true); setError("");
    try {
      const folder = await creation.create(value, parentId);
      if (!mounted.current) return false;
      if (!folder) {
        setError(ru ? "Не удалось создать папку. Попробуйте ещё раз." : "Could not create the folder. Please try again.");
        return false;
      }
      creation.created(folder);
      return true;
    } catch {
      if (mounted.current) setError(ru ? "Не удалось создать папку. Попробуйте ещё раз." : "Could not create the folder. Please try again.");
      return false;
    } finally {
      pending.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  return { name, setName, saving, error, save, canSave: Boolean(name.trim()) && !saving && !disabled,
    cancel() { if (!pending.current) creation.close(); } };
}
