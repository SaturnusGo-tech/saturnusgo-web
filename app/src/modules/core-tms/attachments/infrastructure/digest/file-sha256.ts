import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

const chunkBytes = 4 * 1024 * 1024;

export async function calculateFileSha256(
  file: Blob,
  signal?: AbortSignal,
): Promise<string> {
  if (!Number.isSafeInteger(file.size) || file.size < 1) {
    throw new RangeError("Attachment must not be empty.");
  }
  const hash = sha256.create();
  try {
    for (let offset = 0; offset < file.size; offset += chunkBytes) {
      signal?.throwIfAborted();
      const chunk = file.slice(offset, Math.min(offset + chunkBytes, file.size));
      hash.update(new Uint8Array(await chunk.arrayBuffer()));
    }
    signal?.throwIfAborted();
    return bytesToHex(hash.digest());
  } finally {
    hash.destroy();
  }
}
