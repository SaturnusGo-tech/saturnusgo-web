"use client";
import { Button } from "@heroui/react";
import { Command } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./ql-search-hint.module.css";

type Props = { active?: boolean; ru?: boolean; disabled?: boolean; open?: boolean; controls?: string; onOpen(): void };
export function QlSearchHint({ active = false, ru, disabled, open, controls, onOpen }: Props) {
  const [mac, setMac] = useState(true);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)), []);
  return <Button type="button" size="sm" variant="light" disableRipple className={styles.action}
    isDisabled={disabled} onPress={disabled ? undefined : onOpen} aria-expanded={open} aria-controls={controls}
    aria-label={ru ? "Выполнить QL-запрос" : "Run QL query"}>
    <kbd className={styles.hint} data-ql-search-hint data-active={active || undefined} aria-hidden="true">
      {mac ? <Command size={11} strokeWidth={1.8} /> : <span>Ctrl</span>}<span>L</span>
    </kbd>
  </Button>;
}
