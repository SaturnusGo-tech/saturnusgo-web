/** Presentation permissions from an authenticated composition; the API authorizes every command. */
export interface AdministrationActor {
  readonly id: string;
  readonly owner: boolean;
  readonly selfProfileOnly?: boolean;
  readonly memberAvatars?: boolean;
  readonly canTransferOwnership?: boolean;
  readonly managedReauthentication?: boolean;
}
