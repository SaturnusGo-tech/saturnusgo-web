export type QueryToken = { value: string; start: number; end: number; quoted?: boolean };
export function tokenizeCaseQuery(source: string): { tokens: QueryToken[]; error?: string } {
 const tokens: QueryToken[] = []; let index = 0;
 while (index < source.length) {
  if (/\s/u.test(source[index])) { index++; continue; }
  const start = index; const first = source[index];
  if (['"', "'", "«", "“"].includes(first)) {
   const close = first === "«" ? "»" : first === "“" ? "”" : first;
   let value = ""; index++;
   while (index < source.length && source[index] !== close) {
    if (source[index] === "\\" && [close, "\\"].includes(source[index + 1])) index++;
    value += source[index++];
   }
   if (source[index] !== close) return { tokens, error: "quote" };
   tokens.push({ value, start, end: ++index, quoted: true }); continue;
  }
  const operator = /^(?:!=|==|&&|\|\||[():=,~!])/.exec(source.slice(index))?.[0];
  if (operator || first === "-") {
   const value = operator ?? first; index += value.length; tokens.push({ value, start, end: index }); continue;
  }
  while (index < source.length && !/[\s():=,~!"'«“]/u.test(source[index]) && !source.slice(index).startsWith("&&") && !source.slice(index).startsWith("||")) index++;
  if (start === index) index++;
  tokens.push({ value: source.slice(start, index), start, end: index });
 }
 return { tokens };
}
