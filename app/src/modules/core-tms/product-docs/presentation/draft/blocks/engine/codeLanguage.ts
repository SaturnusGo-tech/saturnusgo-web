import { LanguageDescription } from "@codemirror/language";
import { languages } from "@codemirror/language-data";

const commonLanguages = [
  ["bash", "Bash"], ["c", "C"], ["cpp", "C++"], ["csharp", "C#"], ["css", "CSS"], ["go", "Go"],
  ["gherkin", "Gherkin"], ["html", "HTML"], ["http", "HTTP"], ["java", "Java"], ["js", "JavaScript"],
  ["json", "JSON"], ["kotlin", "Kotlin"], ["md", "Markdown"], ["php", "PHP"], ["powershell", "PowerShell"],
  ["python", "Python"], ["ruby", "Ruby"], ["rust", "Rust"], ["sql", "SQL"], ["swift", "Swift"],
  ["ts", "TypeScript"], ["xml", "XML"], ["yaml", "YAML"],
] as const;
const plainTextTokens = new Set(["", "text", "plain", "plaintext", "txt"]);

export function productDocCodeLanguage(language: string) {
  const value = language.trim().toLowerCase();
  if (plainTextTokens.has(value)) return undefined;
  return LanguageDescription.matchLanguageName(languages, value, false)
    ?? LanguageDescription.matchFilename(languages, `snippet.${value}`);
}

const supported = commonLanguages.flatMap(([value, label]) => {
  const syntax = productDocCodeLanguage(value);
  return syntax ? [{ value, label, syntax }] : [];
});

export function productDocCodeLanguageValue(language: string) {
  if (plainTextTokens.has(language.trim().toLowerCase())) return "";
  const syntax = productDocCodeLanguage(language);
  return supported.find((entry) => entry.syntax === syntax)?.value ?? language;
}

export function productDocLanguageOptions(language: string, plainText: string) {
  const options = [{ value: "", label: plainText }, ...supported.map(({ value, label }) => ({ value, label }))];
  if (!language || options.some((option) => option.value === language)) return options;
  // Keep the current fence token available, including imported languages without a grammar.
  options.push({ value: language, label: productDocCodeLanguageLabel(language, plainText) });
  return options;
}

export function productDocCodeLanguageLabel(language: string, plainText: string) {
  const value = productDocCodeLanguageValue(language);
  if (!value) return plainText;
  return supported.find((entry) => entry.value === value)?.label ?? productDocCodeLanguage(value)?.name ?? `${value} · ${plainText}`;
}
