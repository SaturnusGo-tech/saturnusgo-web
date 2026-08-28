export type RunItemMutationResource<T extends { id: string }> = Readonly<{
  data: T;
  etag: string | null;
}>;

type Lane<T extends { id: string }> = {
  resource: RunItemMutationResource<T>;
  pending: number;
  tail: Promise<void>;
};

export function createRunItemMutationQueue<T extends { id: string }>() {
  const lanes = new Map<string, Lane<T>>();

  function replace(resource: RunItemMutationResource<T>) {
    const lane = lanes.get(resource.data.id);
    if (lane) lane.resource = resource;
    else lanes.set(resource.data.id, { resource, pending: 0, tail: Promise.resolve() });
  }

  return Object.freeze({
    sync(resource: RunItemMutationResource<T>) {
      const lane = lanes.get(resource.data.id);
      if (!lane || lane.pending === 0) replace(resource);
    },
    replace,
    patch(itemId: string, update: (data: T) => T) {
      const lane = lanes.get(itemId);
      if (lane) lane.resource = { ...lane.resource, data: update(lane.resource.data) };
    },
    run(
      itemId: string,
      operation: (
        resource: RunItemMutationResource<T>,
      ) => Promise<RunItemMutationResource<T>>,
    ) {
      const lane = lanes.get(itemId);
      if (!lane) return Promise.reject(new Error("Run item resource is not ready."));
      lane.pending += 1;
      const result = lane.tail.then(async () => {
        const next = await operation(lane.resource);
        lane.resource = next;
        return next;
      });
      lane.tail = result.then(
        () => { lane.pending -= 1; },
        () => { lane.pending -= 1; },
      );
      return result;
    },
  });
}
