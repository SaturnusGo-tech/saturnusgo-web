import type { VerificationRunRequest } from "../../model/verification";

export function buildVerificationRunRequest(scopeToken: string, environmentId: string, build: string, ru: boolean): VerificationRunRequest {
  const reference = build.trim();
  const name = `${ru ? "Проверка исправлений" : "Fix verification"} · ${reference}`;
  return { scopeToken, environmentId, build: reference,
    name: name.slice(0, 240).replace(/[\uD800-\uDBFF]$/, "") };
}
