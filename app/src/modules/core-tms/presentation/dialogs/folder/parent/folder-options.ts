type FolderOption = Readonly<{ value: string; label: string }>;

export function sortFolderOptions(options: readonly FolderOption[]): FolderOption[] {
  const collator = new Intl.Collator(undefined, { numeric: true });
  return [...options].sort((left, right) => {
    const a = left.value.split("/").filter(Boolean);
    const b = right.value.split("/").filter(Boolean);
    for (let index = 0; index < Math.min(a.length, b.length); index++) {
      const order = collator.compare(a[index], b[index]);
      if (order) return order;
    }
    return a.length - b.length;
  });
}
