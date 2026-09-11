import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";

type CaseGroup = { id: string; label: string; cases: TestCaseSummary[] };
export function runRepositoryGroups(cases: TestCaseSummary[], facets: string[], projects: readonly { id: string; name: string }[], ru: boolean): CaseGroup[] {
  const groups = new Map<string, CaseGroup>();
  for (const item of cases) {
    let paths: { keys: string[]; labels: string[] }[] = [{ keys: [], labels: [] }];
    for (const facet of facets) {
      const values = facet === "project"
        ? [{ key: item.projectId, label: projects.find(p => p.id === item.projectId)?.name ?? item.projectId }]
        : facet === "component"
          ? [{ key: item.component, label: item.component || (ru ? "Без компонента" : "No component") }]
          : item.tags.length ? [...new Set(item.tags)].map(tag => ({ key: tag, label: tag }))
            : [{ key: "", label: ru ? "Без тегов" : "No tags" }];
      paths = paths.flatMap(path => values.map(value => ({ keys: [...path.keys, value.key], labels: [...path.labels, value.label] })));
    }
    for (const path of paths) {
      const id = JSON.stringify(path.keys);
      const group = groups.get(id) ?? { id, label: path.labels.join(" / ") || (ru ? "Кейсы прогона" : "Run cases"), cases: [] };
      group.cases.push(item);
      groups.set(id, group);
    }
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
}
