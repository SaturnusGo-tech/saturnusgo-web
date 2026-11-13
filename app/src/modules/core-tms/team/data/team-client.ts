import type { TmsHttpClient } from '../../../../core/tms/transport/http';
import type { components } from '../../../../core/tms/generated/tms-api';
import type { TeamPort } from '../domain/team';
export function createTeamClient(http: TmsHttpClient, workspaceId: string): TeamPort {
  return { list: async (search, cursor, signal) => {
    const query = new URLSearchParams({ limit: '24' });
    if (search.trim()) query.set('search', search.trim());
    if (cursor) query.set('cursor', cursor);
    const result = await http.get<components['schemas']['WorkspaceTeamPage']>(
      `/workspaces/${encodeURIComponent(workspaceId)}/team?${query}`, signal);
    return { items: result.data.map(member=>({id:member.id,name:member.name,kind:member.kind,
      role:member.role,status:member.status,presence:member.presence,avatarUrl:member.avatar?.url??null,
      avatarCharacterId:member.avatarCharacterId,achievements:{earned:member.achievements.earned,
        total:member.achievements.total,remaining:member.achievements.remaining,
        items:member.achievements.items.map(item=>({slug:item.slug})),
        lockedPreview:member.achievements.lockedPreview?{slug:member.achievements.lockedPreview.slug}:null}})),
      nextCursor: result.meta.nextCursor };
  } };
}
