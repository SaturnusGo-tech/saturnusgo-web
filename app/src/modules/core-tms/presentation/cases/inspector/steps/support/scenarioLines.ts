export function splitScenarioAction(value: string): string[] {
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  return lines.length > 0 ? lines : [""];
}

export function joinScenarioAction(lines: readonly string[]): string {
  return lines.join("\n");
}

export function replaceScenarioLine(
  lines: readonly string[],
  index: number,
  value: string,
) {
  const replacement = value.replace(/\r\n?/g, "\n").split("\n");
  return [
    ...lines.slice(0, index),
    ...replacement,
    ...lines.slice(index + 1),
  ];
}

export function insertScenarioLine(lines: readonly string[], index: number) {
  return [...lines.slice(0, index + 1), "", ...lines.slice(index + 1)];
}

export function removeScenarioLine(lines: readonly string[], index: number) {
  if (index <= 0 || lines.length <= 1) return [...lines];
  return [...lines.slice(0, index), ...lines.slice(index + 1)];
}

export function scenarioLineLabel(stepOrder: number, lineIndex: number) {
  return lineIndex === 0 ? `${stepOrder}` : `${stepOrder}.${lineIndex}`;
}
