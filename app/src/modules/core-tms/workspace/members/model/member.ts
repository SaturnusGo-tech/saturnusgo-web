export type WorkspaceMember = Readonly<{ id: string; name: string; email?: string | null; kind?: "human" | "agent"; provider?: "codex"; status?: "active" | "inactive" }>;
