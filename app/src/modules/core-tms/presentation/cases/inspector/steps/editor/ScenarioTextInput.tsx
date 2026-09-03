"use client";

import { useLayoutEffect, useRef, type ClipboardEventHandler, type KeyboardEventHandler } from "react";

type Props = {
  id?: string;
  value: string;
  label: string;
  placeholder: string;
  autoFocus?: boolean;
  className?: string;
  onChange: (value: string) => void;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
  onPaste?: ClipboardEventHandler<HTMLTextAreaElement>;
};

export function ScenarioTextInput(props: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = "0px";
    node.style.height = `${node.scrollHeight}px`;
  }, [props.value]);

  return <textarea
    ref={ref}
    id={props.id}
    rows={1}
    value={props.value}
    aria-label={props.label}
    placeholder={props.placeholder}
    autoFocus={props.autoFocus}
    className={props.className}
    onChange={(event) => props.onChange(event.target.value)}
    onKeyDown={props.onKeyDown}
    onPaste={props.onPaste}
  />;
}
