import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { listWorkspaceActors } from "./actor-api";
import type { WorkspaceActor } from "../../model/actors/workspace-actor";
type Request = {
    controller: AbortController;
    readers: number;
    promise: Promise<WorkspaceActor | null>;
};
const requests = new WeakMap<TmsHttpClient, Map<string, Request>>();
export function requestWorkspaceActor(http: TmsHttpClient, workspaceId: string, identityId: string, signal: AbortSignal, includeSignIn = false): Promise<WorkspaceActor | null> {
    if (signal.aborted)
        return Promise.reject(signal.reason);
    let scoped = requests.get(http);
    if (!scoped) {
        scoped = new Map();
        requests.set(http, scoped);
    }
    const registry = scoped;
    const key = JSON.stringify([workspaceId, identityId, includeSignIn]);
    let request = scoped.get(key);
    if (!request || request.controller.signal.aborted) {
        const controller = new AbortController();
        const created: Request = { controller, readers: 0, promise: Promise.resolve(null) };
        created.promise = listWorkspaceActors(http, workspaceId, { identityId, includeSignIn }, controller.signal)
            .then((page) => page.items.find((item) => item.identityId === identityId) ?? null)
            .finally(() => { if (scoped.get(key) === created)
            scoped.delete(key); });
        request = created;
        scoped.set(key, request);
    }
    const current = request;
    current.readers += 1;
    return new Promise((resolve, reject) => {
        let settled = false;
        function finish() {
            if (settled)
                return false;
            settled = true;
            signal.removeEventListener("abort", cancel);
            current.readers -= 1;
            if (!current.readers) {
                current.controller.abort();
                if (registry.get(key) === current)
                    registry.delete(key);
            }
            return true;
        }
        function cancel() { if (finish())
            reject(signal.reason); }
        signal.addEventListener("abort", cancel, { once: true });
        current.promise.then((name) => { if (finish())
            resolve(name); }, (error) => { if (finish())
            reject(error); });
    });
}
