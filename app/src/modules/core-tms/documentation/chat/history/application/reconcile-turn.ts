import { TmsApiError } from "../../../../../../core/tms/transport/http";
import type { GuideHistoryApi } from "../model/api";

export async function reconcileGuideTurn(api: GuideHistoryApi, chatId: string, turnId: string) {
  let chat;
  try { chat = await api.chat(chatId); } catch (error) {
    if (error instanceof TmsApiError && error.status === 404) return { chat: null, turn: null };
    throw error;
  }
  try { return { chat, turn: await api.turn(chatId, turnId) }; }
  catch (error) {
    if (error instanceof TmsApiError && error.status === 404) return { chat, turn: null };
    throw error;
  }
}
