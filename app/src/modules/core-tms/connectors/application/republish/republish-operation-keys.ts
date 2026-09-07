export class RepublishOperationKeys {
  private pending = new Map<string, Readonly<{ key: string; etag: string }>>();

  constructor(private readonly createKey: () => string = () => crypto.randomUUID()) {}

  begin(target: string, etag: string) {
    const request = this.pending.get(target) ?? { key: this.createKey(), etag };
    this.pending.set(target, request);
    return request;
  }

  complete(target: string, key: string) {
    if (this.pending.get(target)?.key === key) this.pending.delete(target);
  }
}
