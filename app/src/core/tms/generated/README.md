# Generated TMS API contract

`tms-api.ts` is generated from the versioned backend OpenAPI document and is the only generated
TypeScript exception to the handwritten 200-line source limit in this directory. Do not edit it.

`tms-openapi.json` is a versioned mirror of the backend source of truth so an isolated frontend
checkout can verify generation without credentials for the private backend repository. Update both
generated artifacts with `npm run sync:tms-contract`; set `TMS_OPENAPI_PATH` only when the backend
checkout is not at the default sibling path. CI runs `npm run check:tms-contract` and the attachment
transport tests before building.
