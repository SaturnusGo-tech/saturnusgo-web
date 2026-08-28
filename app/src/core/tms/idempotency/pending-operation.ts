export type PendingOperation = Readonly<{
  signature: string;
  key: string;
}>;

export function resolvePendingOperation(
  current: PendingOperation | null,
  signature: string,
  createKey: () => string = () => crypto.randomUUID(),
): PendingOperation {
  return current?.signature === signature
    ? current
    : { signature, key: createKey() };
}
