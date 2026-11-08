const optionTokens = {
  wrap: "falcon-no-wrap",
  lineNumbers: "falcon-no-line-numbers",
} as const;

type CodeSetting = keyof typeof optionTokens;

function fenceTokens(meta: string): string[] {
  return meta.match(/(?:[^\s"'\\]|\\.|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|["'\\])+/g) ?? [];
}

export function productDocCodeSettings(meta: string) {
  const tokens = fenceTokens(meta);
  return { wrap: !tokens.includes(optionTokens.wrap), lineNumbers: !tokens.includes(optionTokens.lineNumbers) };
}

export function updateProductDocCodeSetting(meta: string, setting: CodeSetting, enabled: boolean) {
  const option = optionTokens[setting];
  const tokens = fenceTokens(meta).filter((token) => token !== option);
  if (!enabled) tokens.push(option);
  return tokens.join(" ");
}
