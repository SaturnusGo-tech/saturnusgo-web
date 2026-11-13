'use client';
import { useMemo } from 'react';
import { useTmsHttpClient } from '../../auth/http/TmsHttpClientContext';
import { useTmsLocale } from '../../localization/context/useTmsLocale';
import { createTeamClient } from '../data/team-client';
import { useTeam } from '../application/useTeam';
import { useTeamSearch } from '../application/useTeamSearch';
import { TeamPage } from '../presentation/page/TeamPage';
export function TeamFeature({workspaceId,workspaceName}:{workspaceId:string;workspaceName:string}) {
  const http = useTmsHttpClient(), {locale} = useTmsLocale(), search = useTeamSearch();
  const client = useMemo(() => createTeamClient(http,workspaceId),[http,workspaceId]);
  const resource = useTeam(client,search.query);
  return <TeamPage workspaceId={workspaceId} workspaceName={workspaceName} ru={locale==='ru'} search={search.search}
    onSearch={search.setSearch} {...resource} onMore={() => {void resource.loadMore();}} />;
}
