import { proxyCompanyApi } from "./proxy-company-api.mjs";

export async function verifyCompanyDocument(request, env, audience, send = fetch) {
  const incoming = new URL(request.url);
  const headers = new Headers();
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) headers.set("cf-connecting-ip", ip);
  const response = await proxyCompanyApi(new Request(`${incoming.origin}/api/v1/auth/entrypoint`, { headers }), env, audience, send);
  if (!response.ok) return { ok: false, status: response.status >= 500 ? 503 : 404 };
  try {
    const payload = await response.json();
    if (payload?.data?.hostname !== incoming.hostname || payload?.data?.audience !== audience
      || typeof payload.data.available !== "boolean") return { ok: false, status: 503 };
    return { ok: true };
  } catch { return { ok: false, status: 503 }; }
}

export function unavailableCompanyDocument(status, head = false) {
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Falcon</title>
  <style>html{color-scheme:light dark;--falcon-surface:light-dark(#fcfcfc,#0e0e0e);--falcon-text:light-dark(#0d0d0d,#ededed);--falcon-text-secondary:light-dark(#5d5d5d,#cdcdcd);--falcon-action:light-dark(#0d0d0d,#ededed);--falcon-action-hover:light-dark(#303030,#ededed);--falcon-on-action:light-dark(#ffffff,#0d0d0d);--falcon-focus:#3a83f7}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--falcon-surface);color:var(--falcon-text);font:15px/1.6 system-ui,sans-serif}main{width:min(390px,calc(100% - 48px))}h1{font-size:27px;font-weight:550;letter-spacing:-.7px}p{color:var(--falcon-text-secondary)}a{display:inline-block;border-radius:11px;padding:9px 16px;background:var(--falcon-action);color:var(--falcon-on-action);text-decoration:none;margin-top:14px}a:hover{background:var(--falcon-action-hover)}a:focus-visible{outline:2px solid var(--falcon-focus);outline-offset:3px}</style></head>
  <body><main><span>Falcon</span><h1>${status === 404 ? "Адрес недоступен" : "Не удалось открыть Falcon"}</h1><p>${status === 404 ? "Проверьте адрес компании или обратитесь к своему администратору." : "Соединение временно недоступно. Попробуйте ещё раз."}</p><a href="/">${status === 404 ? "Проверить адрес" : "Повторить"}</a></main></body></html>`;
  return new Response(head ? null : html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" } });
}
