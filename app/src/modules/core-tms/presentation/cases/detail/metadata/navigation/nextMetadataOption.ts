export function nextMetadataOption(
  length: number,
  current: number,
  key: "ArrowDown" | "ArrowUp" | "Home" | "End",
) {
  if (!length) return -1;
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  return key === "ArrowDown"
    ? (current + 1) % length
    : (current - 1 + length) % length;
}
