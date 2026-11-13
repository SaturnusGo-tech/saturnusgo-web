import type { components } from '../../../../../core/tms/generated/tms-api';
import type { SelfProfilePort } from '../../self/domain/profile-model';
export type PublicActorProfile = components['schemas']['WorkspaceActorProfile'];
export interface PublicProfilePort extends Pick<SelfProfilePort,'activity'|'calendar'|'achievements'> {
 read(signal:AbortSignal):Promise<PublicActorProfile>;
}
