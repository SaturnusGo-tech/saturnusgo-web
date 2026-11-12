export type IntegrationOption = Readonly<{ value: string; label: string; description?: string }>;

export function createIntegrationSelection(options: readonly IntegrationOption[], values: readonly string[]) {
  const available = new Map<string, IntegrationOption>();
  for (const option of options) if (!available.has(option.value)) available.set(option.value, option);
  for (const value of values) if (value && !available.has(value)) available.set(value, { value, label: value });
  const keyed = [...available.values()].map(option => ({ ...option, key: `value:${option.value}` }));
  const byKey = new Map(keyed.map(option => [option.key, option.value]));
  const selectedKeys = [...new Set(values)].filter(value => available.has(value)).map(value => `value:${value}`);
  return {
    options: keyed,
    selectedKeys,
    valuesFor(keys: Iterable<string | number> | "all"): string[] {
      if (keys === "all") return keyed.map(option => option.value);
      return [...keys].flatMap(key => byKey.has(String(key)) ? [byKey.get(String(key))!] : []);
    },
  };
}
