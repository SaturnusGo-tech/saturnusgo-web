function stripMarkup(value: string) {
  return value.replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*?)?\s*\/?>/g, "")
    .replace(/<(?:!DOCTYPE|\?xml)[^>]*>/gi, "");
}

// Fenced snippets are literal text. Do not remove HTML/XML that a QA is testing.
export function stripRawHtml(markdown: string) {
  const output: string[] = [];
  let prose: string[] = [];
  let fence = "";
  for (const line of markdown.split("\n")) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      output.push(line);
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = "";
    } else if (marker && (marker[1][0] !== "`" || !marker[2].includes("`"))) {
      if (prose.length) output.push(stripMarkup(prose.join("\n")));
      prose = [];
      fence = marker[1];
      output.push(line);
    } else prose.push(line);
  }
  if (prose.length) output.push(stripMarkup(prose.join("\n")));
  return output.join("\n");
}
