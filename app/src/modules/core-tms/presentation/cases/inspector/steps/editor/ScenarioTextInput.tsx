"use client";

import { useLayoutEffect, useRef, type ReactNode, type ClipboardEventHandler, type DragEventHandler, type KeyboardEventHandler } from "react";

import { EmojiButton } from "../../../../common/emoji/EmojiButton";
import { useTextareaEmoji } from "../../../../common/emoji/selection/useTextareaEmoji";
import { useStepHistory } from "../markdown/history/useStepHistory";

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
  onDragOver?: DragEventHandler<HTMLTextAreaElement>;
  onDrop?: DragEventHandler<HTMLTextAreaElement>;
  renderFooter?: (emoji: ReactNode) => ReactNode;
  ru?: boolean;
};

export function ScenarioTextInput(props: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const history = useStepHistory(props.value, props.onChange, ref);
  const emoji = useTextareaEmoji(props.value, ref, (next, caret) => { history.boundary(); history.record(next, false, {start:caret,end:caret}); }, history.boundary);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = "0px";
    node.style.height = `${node.scrollHeight}px`;
  }, [props.value]);

  return <><textarea
    ref={ref}
    id={props.id}
    rows={1}
    value={props.value}
    aria-label={props.label}
    placeholder={props.placeholder}
    autoFocus={props.autoFocus}
    className={props.className}
    onChange={(event) => history.record(event.target.value, (event.nativeEvent as InputEvent).inputType === "insertText")}
    onKeyDown={(event) => { if (!history.onKeyDown(event)) props.onKeyDown?.(event); }}
    onPaste={props.onPaste}
    onDragOver={props.onDragOver}
    onDrop={props.onDrop}
  />{props.renderFooter?.(<EmojiButton locale={props.ru ? "ru" : "en"} onOpen={emoji.remember} onSelect={emoji.insert} />)}</>;
}
