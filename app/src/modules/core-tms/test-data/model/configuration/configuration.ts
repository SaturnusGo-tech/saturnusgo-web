export type TdmConfiguration = { readonly enabled: boolean; readonly credentialsAvailable: boolean; readonly revealVerificationAvailable: boolean; readonly permissions: readonly string[];
  readonly limits: { readonly aliasLength: number; readonly nameLength: number; readonly descriptionLength: number;
    readonly stringBytes: number; readonly jsonBytes: number; readonly datasetFields: number; readonly bindings: number;
    readonly pageSize: number; readonly revealSeconds: number } };
