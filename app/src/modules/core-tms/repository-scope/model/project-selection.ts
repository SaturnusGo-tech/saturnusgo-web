/** An empty selection means the whole portfolio, including newly added projects. */
export function selectPortfolioProjects<T extends { id: string }>(projects: readonly T[], selected: readonly string[]): T[] {
  return projects.filter(project => !selected.length || selected.includes(project.id));
}
export function togglePortfolioProject(selected: readonly string[], id: string): string[] {
  if (id === "all") return [];
  return selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id];
}
