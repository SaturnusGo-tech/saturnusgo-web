import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import type { Profile, DeviceSession } from "../../company-administration/domain/administration";

const origin = "https://security-preview.invalid";
const profile: Profile = { id: "sample-security-person", name: "Alex Morgan", login: "alex.morgan", email: "alex@example.invalid",
  emailVerified: true, phone: "", role: "tester", owner: false, hasAvatar: false, version: 1, mfaEnabled: false, emailChangeAvailable: false };
const sessions: DeviceSession[] = [
  { id: "sample-current", current: true, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36", stage: "authenticated", createdAt: "2026-11-12T08:25:00Z", expiresAt: "2026-12-12T08:25:00Z" },
  { id: "sample-iphone", current: false, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1", stage: "authenticated", createdAt: "2026-11-11T14:10:00Z", expiresAt: "2026-12-11T14:10:00Z" },
  { id: "sample-old-desktop", current: false, userAgent: "Falcon Desktop", stage: "authenticated", createdAt: "2026-11-10T10:00:00Z", expiresAt: "2026-12-10T10:00:00Z" },
  { id: "sample-windows", current: false, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36", stage: "authenticated", createdAt: "2026-11-08T09:40:00Z", expiresAt: "2026-12-08T09:40:00Z" },
];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", etag: '"sample:1"' } });

/** Local read-only fixture. Never forwards a request or records entered credentials. */
export function createSecurityPreviewClient(mfaEnabled: boolean) {
  const send: typeof fetch = async (input, init) => {
    const request = input instanceof Request ? input : null;
    (init?.signal ?? request?.signal)?.throwIfAborted();
    const url = new URL(request?.url ?? String(input), origin);
    const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
    if (url.origin === origin && method === "GET") {
      if (url.pathname === "/api/v1/profile") return json({ data: { ...profile, mfaEnabled } });
      if (url.pathname === "/api/v1/profile/sessions") return json({ data: sessions, meta: { nextCursor: null } });
      if (url.pathname === "/api/v1/auth/methods") return json({ data: { google: true, email: true, company: true } });
    }
    return json({ error: { code: "ACCESS_DENIED", message: "Security changes and external requests are disabled in this sample-only preview." } }, 403);
  };
  return { fetch: send, http: createTmsHttpClient({ apiBase: `${origin}/api/v1`, credentials: "include", production: false, fetch: send }) };
}
