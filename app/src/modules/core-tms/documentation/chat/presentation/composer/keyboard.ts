export function shouldSendQuestion(event: { key: string; shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean;
  nativeEvent: { isComposing?: boolean; keyCode?: number } }) {
  return event.key === "Enter" && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey
    && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229;
}
