import type { RunEvidenceCandidate } from "../../../domain/run/productDocRunCandidates";

export type RunEvidenceGroup = "project" | "component" | "tag";
export type RunEvidenceRow = { id: string; run: RunEvidenceCandidate };

export function groupRunEvidence(runs: readonly RunEvidenceCandidate[], group: RunEvidenceGroup | null, noValue: string) {
  const sections = new Map<string, { id: string; label: string; rows: RunEvidenceRow[] }>();
  for (const run of runs) {
    const values = group === "project" ? [{ id: run.projectId, label: run.projectName }]
      : (group === "component" ? run.components : group === "tag" ? run.tags : undefined)?.map((label) => ({ id: label, label }));
    for (const value of values?.length ? values : [{ id: "", label: group ? noValue : "" }]) {
      const section = sections.get(value.id) ?? { ...value, rows: [] };
      section.rows.push({ id: JSON.stringify([value.id, run.id]), run });
      sections.set(value.id, section);
    }
  }
  return [...sections.values()];
}
