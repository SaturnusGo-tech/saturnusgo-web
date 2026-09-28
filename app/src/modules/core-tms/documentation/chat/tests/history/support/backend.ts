import { TmsApiError, type TmsHttpClient } from "../../../../../../../core/tms/transport/http";
import type { GuideChatSummary, GuideChatTurn } from "../../../history/model/history";
import type { GuideAnswer } from "../../../model/conversation";

type Request = { chatId: string; body: { turnId: string; content: string; expectedVersion: number }; signal: AbortSignal;
  controller: ReadableStreamDefaultController<Uint8Array>; cancelled: boolean };
export function guideBackend() {
  const chats = new Map<string, GuideChatSummary>(), turns = new Map<string, GuideChatTurn[]>(), requests: Request[] = [];
  let serial = 0, failReads = false;
  const timestamp = () => new Date(Date.UTC(2026, 8, 28, 10, 0, serial++)).toISOString();
  const missing = () => new TmsApiError("Missing", 404, "fixture");
  const clone = <T,>(value: T): T => structuredClone(value);
  const base = (path: string) => new URL(path, "https://fixture.test").pathname.split("/documentation-chats")[1]?.split("/").filter(Boolean) ?? [];
  const getChat = (id: string) => { const chat = chats.get(id); if (!chat) throw missing(); return chat; };
  const getTurn = (id: string, turnId: string) => { const turn = turns.get(id)?.find(item => item.id === turnId); if (!turn) throw missing(); return turn; };
  const api = {
    async get(path: string) {
      if (failReads) throw new Error("Network unavailable");
      const [id, segment, turnId] = base(path);
      if (!id) return { data: clone([...chats.values()]), meta: { nextCursor: null } };
      if (!segment) return { data: clone(getChat(id)) };
      if (segment === "turns" && turnId) return { data: clone(getTurn(id, turnId)) };
      if (segment === "turns") return { data: clone(turns.get(id) ?? []), meta: { nextCursor: null } };
      return { data: [], meta: { nextCursor: null } };
    },
    async mutate(path: string, _method: string, body: { chatId?: string; locale?: "ru" | "en" }) {
      const [id, segment, turnId, action] = base(path);
      if (!id && body.chatId) {
        const existing = chats.get(body.chatId); if (existing) return clone(existing);
        const time = timestamp(), chat: GuideChatSummary = { id: body.chatId, title: "", locale: body.locale!, version: 0,
          createdAt: time, updatedAt: time, archivedAt: null, pendingTurnId: null };
        chats.set(chat.id, chat); turns.set(chat.id, []); return clone(chat);
      }
      if (segment === "turns" && action === "cancel") {
        const turn = getTurn(id, turnId), chat = getChat(id);
        if (turn.state === "pending") { turn.state = "cancelled"; chat.pendingTurnId = null; chat.version++; }
        return clone(turn);
      }
      throw missing();
    },
    async stream(path: string, body: Request["body"], signal: AbortSignal) {
      const [chatId] = base(path), chat = getChat(chatId);
      if (chat.version !== body.expectedVersion) throw new TmsApiError("Version conflict", 409, "fixture");
      const createdAt = timestamp(), turn: GuideChatTurn = { id: body.turnId, question: body.content, state: "pending", answer: null,
        errorCode: null, createdAt, completedAt: null };
      turns.get(chatId)!.push(turn); chat.pendingTurnId = turn.id; chat.version++; chat.title ||= body.content; chat.updatedAt = createdAt;
      const request = { chatId, body, signal, cancelled: false } as Request; requests.push(request);
      return new Response(new ReadableStream({ start(controller) { request.controller = controller;
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "accepted", chat: clone(chat), turn: clone(turn) })}\n\n`));
      }, cancel() { request.cancelled = true; } }), { headers: { "content-type": "text/event-stream" } });
    },
  } as unknown as TmsHttpClient;
  function event(index: number, value: unknown) {
    if (!requests[index].cancelled) requests[index].controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(value)}\n\n`));
  }
  function complete(index: number, answer = "Answer", emit = true) {
    const request = requests[index], turn = getTurn(request.chatId, request.body.turnId), chat = getChat(request.chatId);
    const data: GuideAnswer = { answer, citations: [], knowledgeVersion: "fixture" };
    turn.state = "completed"; turn.answer = data; turn.completedAt = timestamp(); chat.pendingTurnId = null; chat.version++; chat.updatedAt = turn.completedAt;
    if (emit) event(index, { type: "complete", data, chat: clone(chat), turn: clone(turn) });
  }
  function fail(index: number, code = "AI_GUIDE_UNAVAILABLE") {
    const request = requests[index], turn = getTurn(request.chatId, request.body.turnId), chat = getChat(request.chatId);
    turn.state = "failed"; turn.errorCode = code; chat.pendingTurnId = null; chat.version++;
    event(index, { type: "error", error: { code, message: "Safe failure", requestId: "fixture" } });
  }
  return { api, chats, turns, requests, event, complete, fail, setReadFailure: (value: boolean) => { failReads = value; },
    disconnect: (index: number) => requests[index].controller.error(new Error("Connection lost")) };
}
