import type { ProductDocScope } from "../../domain/product-docs";

const listeners = new Set<(scope: ProductDocScope, caseId: string) => void>();

export function notifyCaseRequirementsChanged(scope: ProductDocScope, caseId: string) {
  listeners.forEach(listener => listener(scope, caseId));
}

export function subscribeCaseRequirementsChanged(listener: (scope: ProductDocScope, caseId: string) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
