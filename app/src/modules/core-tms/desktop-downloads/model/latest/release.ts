import { parseVersion } from "../version/semver";
export type DesktopArtifact = { id: "mac-arm64" | "mac-x64" | "win-x64"; platform: string; label: string;
  minimum: string; file: string; bytes: number; sha256: string; contentType: string };
export type DesktopRelease = { version: string; channel: "beta"; baseUrl: string; checksums: string; artifacts: DesktopArtifact[] };
const formats = {
  "mac-arm64": ["mac", "beta.dmg", "application/x-apple-diskimage"],
  "mac-x64": ["mac", "beta.dmg", "application/x-apple-diskimage"],
  "win-x64": ["windows", "beta-setup.exe", "application/vnd.microsoft.portable-executable"],
} as const;
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
export function parseDesktopRelease(value: unknown): DesktopRelease {
  if (!object(value) || typeof value.version !== "string" || !parseVersion(value.version) || value.channel !== "beta" ||
    value.baseUrl !== `https://saturnusgo.com/falcon/desktop/beta/${value.version}/` || value.checksums !== "SHA256SUMS.txt" ||
    !Array.isArray(value.artifacts) || value.artifacts.length !== 3) throw new Error("Invalid desktop release");
  const seen = new Set<string>();
  for (const artifact of value.artifacts) {
    if (!object(artifact) || typeof artifact.id !== "string" || !Object.prototype.hasOwnProperty.call(formats, artifact.id) || seen.has(artifact.id)) throw new Error("Invalid desktop artifact");
    const [platform, extension, contentType] = formats[artifact.id as keyof typeof formats];
    if (artifact.platform !== platform || artifact.file !== `Falcon-${value.version}-${artifact.id}-${extension}` || artifact.contentType !== contentType ||
      typeof artifact.bytes !== "number" || !Number.isSafeInteger(artifact.bytes) || artifact.bytes <= 0 ||
      typeof artifact.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(artifact.sha256) ||
      ![artifact.label, artifact.minimum].every(text => typeof text === "string" && text.trim().length > 0 && text.length < 120)) throw new Error("Invalid desktop artifact");
    seen.add(artifact.id);
  }
  return value as unknown as DesktopRelease;
}
