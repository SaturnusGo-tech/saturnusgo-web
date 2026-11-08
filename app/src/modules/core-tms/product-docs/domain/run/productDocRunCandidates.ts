import type { components, operations } from "../../../../../core/tms/generated/tms-api";

type Contract = components["schemas"];
type CandidateQuery = NonNullable<operations["listProductDocRunCandidates"]["parameters"]["query"]>;
type CandidateFilter = Exclude<keyof CandidateQuery, "q" | "ql" | "cursor" | "limit" | "projectIds">;

export type CaptureProductDocRunInput = Contract["ProductDocRunEmbedCaptureInput"];
export type RunEvidenceCandidate = Contract["ProductDocRunCandidate"];
export type RunEvidenceQuery = { [Key in CandidateFilter | "projects"]?: readonly string[] } & Pick<CandidateQuery, "q" | "ql">;
export type RunEvidencePage = { items: RunEvidenceCandidate[]; nextCursor: string | null };
