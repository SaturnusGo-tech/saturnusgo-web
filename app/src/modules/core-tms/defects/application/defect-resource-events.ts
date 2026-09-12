const listeners = new Set<(projectId: string) => void>();
export function notifyDefectsChanged(projectId: string): void {
  listeners.forEach((listener) => listener(projectId));
}
export function subscribeDefectsChanged(listener: (projectId: string) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
