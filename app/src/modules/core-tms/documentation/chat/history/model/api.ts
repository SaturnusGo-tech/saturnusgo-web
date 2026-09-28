import type { components } from "../../../../../../core/tms/generated/tms-api";
import type { GuideChatSummary, GuideChatTurn, GuideChatShare, GuideSharedAnswer, GuidePage } from "./history";

export interface GuideHistoryApi {
  list(query: string, cursor: string | null, signal?: AbortSignal): Promise<GuidePage<GuideChatSummary>>;
  create(body: components["schemas"]["DocumentationChatCreateRequest"], signal?: AbortSignal): Promise<GuideChatSummary>;
  rename(id: string, body: components["schemas"]["DocumentationChatRenameRequest"], signal?: AbortSignal): Promise<GuideChatSummary>;
  archive(id: string, body: components["schemas"]["DocumentationChatArchiveRequest"], signal?: AbortSignal): Promise<GuideChatSummary>;
  chat(id: string, signal?: AbortSignal): Promise<GuideChatSummary>;
  turns(id: string, cursor: string | null, signal?: AbortSignal): Promise<GuidePage<GuideChatTurn>>;
  turn(id: string, turnId: string, signal?: AbortSignal): Promise<GuideChatTurn>;
  stream(id: string, body: components["schemas"]["DocumentationChatTurnRequest"], signal: AbortSignal): Promise<Response>;
  cancel(id: string, turnId: string): Promise<GuideChatTurn>;
  shares(id: string, cursor: string | null, signal?: AbortSignal): Promise<GuidePage<GuideChatShare>>;
  share(id: string, turnId: string, body: components["schemas"]["DocumentationChatShareRequest"], signal?: AbortSignal): Promise<GuideChatShare>;
  revoke(id: string, shareId: string, signal?: AbortSignal): Promise<void>;
  shared(id: string, signal?: AbortSignal): Promise<GuideSharedAnswer>;
}
