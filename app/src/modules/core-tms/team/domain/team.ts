export interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly kind: 'human' | 'agent';
  readonly role: 'workspace_admin' | 'qa_manager' | 'tester' | 'reporter' | 'viewer';
  readonly status: 'active' | 'inactive';
  readonly presence: 'online' | 'offline' | null;
  readonly avatarUrl: string | null;
  readonly avatarCharacterId: string | null;
  readonly achievements: {
    readonly earned: number; readonly total: number; readonly remaining: number;
    readonly items: readonly {readonly slug: string}[];
    readonly lockedPreview: {readonly slug: string} | null;
  };
}
export interface TeamPage { readonly items: readonly TeamMember[]; readonly nextCursor: string | null }
export interface TeamPort {
  list(search: string, cursor: string | null, signal: AbortSignal): Promise<TeamPage>;
}
