import type { AccountSpaces, SpaceRedirect, SpaceSelection } from "../domain/account-spaces";
export interface SpaceChoicePort {
  list(signal?: AbortSignal): Promise<AccountSpaces>;
  select(spaceId: SpaceSelection["spaceId"], signal?: AbortSignal): Promise<SpaceRedirect>;
  cancel(signal?: AbortSignal): Promise<void>;
}
