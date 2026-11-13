import type { TmsHttpClient } from '../../../../../core/tms/transport/http';
import type { PublicActorProfile,PublicProfilePort } from '../domain/public-profile';
import type { SelfProfileActivity } from '../../self/domain/profile-model';
import type { ProfileAchievements } from '../../self/domain/achievements/profile-achievement-model';
export function createPublicProfileClient(http:TmsHttpClient,workspaceId:string,identityId:string):PublicProfilePort {
 const path=`/workspaces/${encodeURIComponent(workspaceId)}/actors/${encodeURIComponent(identityId)}/profile`;
 return {
  read:async signal=>(await http.getResource<PublicActorProfile>(path,signal)).data,
  activity:async(_workspace,days,signal)=>(await http.getResource<SelfProfileActivity>(`${path}/activity?days=${days}`,signal)).data,
  calendar:async(_workspace,year,signal)=>(await http.getResource<SelfProfileActivity>(`${path}/activity?year=${year}`,signal)).data,
  achievements:async(_workspace,signal)=>(await http.getResource<ProfileAchievements>(`${path}/achievements`,signal)).data,
 };
}
