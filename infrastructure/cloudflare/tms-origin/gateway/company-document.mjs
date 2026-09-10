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
  <style>html{color-scheme:light dark}body{margin:0;min-height:100vh;display:grid;place-items:center;background:light-dark(#fafafb,#111114);color:light-dark(#252733,#eeeef3);font:15px/1.6 system-ui,sans-serif}main{width:min(390px,calc(100% - 48px))}h1{font-size:27px;font-weight:550;letter-spacing:-.7px}p{opacity:.7}a{display:inline-block;border-radius:11px;padding:9px 16px;background:#386eec;color:#fff;text-decoration:none;margin-top:14px}</style></head>
  <body><main><span>Falcon</span><h1>${status === 404 ? "Адрес недоступен" : "Не удалось открыть Falcon"}</h1><p>${status === 404 ? "Проверьте адрес компании или обратитесь к своему администратору." : "Соединение временно недоступно. Попробуйте ещё раз."}</p><a href="/">${status === 404 ? "Проверить адрес" : "Повторить"}</a></main></body></html>`;
  return new Response(head ? null : html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" } });
}
