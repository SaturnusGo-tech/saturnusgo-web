type SearchKey = {
  key: string; metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean;
  defaultPrevented: boolean; nativeEvent?: { isComposing?: boolean };
};

export function isQlSearchShortcut(event: SearchKey) {
  return !event.defaultPrevented && !event.nativeEvent?.isComposing && !event.altKey && !event.shiftKey
    && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "l";
}
