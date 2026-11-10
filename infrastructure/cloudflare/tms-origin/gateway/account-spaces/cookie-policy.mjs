const paths=new Map([
 ['/api/v1/auth/google/callback','GET'],['/api/v1/auth/email/verify','POST'],
 ['/api/v1/auth/spaces/select','POST'],['/api/v1/auth/federation/cancel','POST'],
]);
const emailProofPaths = new Map([
 ['/api/v1/auth/spaces', 'GET'], ['/api/v1/auth/spaces/select', 'POST'],
 ['/api/v1/auth/federation/cancel', 'POST'],
]);

export function accountSpaceRequestCookieNames(request, audience) {
 return audience === 'personal' && emailProofPaths.get(new URL(request.url).pathname) === request.method
  ? ['__Host-falcon_space_email'] : [];
}

function boundedHostCookie(cookie, name, expires) {
 const [value, ...parts] = cookie.split(';').map(part => part.trim());
 const token = expires ? '' : '[A-Za-z0-9_-]{43}';
 if (!new RegExp(`^${name}=${token}$`).test(value) || parts.length !== 5) return false;
 const attributes = new Set(parts.map(part => part.toLowerCase()));
 return attributes.size === 5 && ['path=/', `max-age=${expires ? 0 : 300}`, 'httponly', 'secure', 'samesite=lax']
  .every(attribute => attributes.has(attribute));
}

function selectionCookieAllowed(request, audience, cookie, status) {
 if (audience !== 'personal' || request.method !== 'POST' || status < 200 || status >= 300) return false;
 const path = new URL(request.url).pathname;
 // Neutral discovery and verified email can clear stale tenant state, never grant it.
 if (['/api/v1/auth/company/resolve', '/api/v1/auth/spaces/select', '/api/v1/auth/email/verify'].includes(path) &&
  boundedHostCookie(cookie, '__Host-falcon_tenant_session', true)) return true;
 if (path === '/api/v1/auth/email/verify') return boundedHostCookie(cookie, '__Host-falcon_space_email', false);
 return ['/api/v1/auth/spaces/select', '/api/v1/auth/federation/cancel'].includes(path) &&
  boundedHostCookie(cookie, '__Host-falcon_space_email', true);
}

export function accountSpaceCookieAllowed(request,audience,cookie,status=0){
 if (selectionCookieAllowed(request, audience, cookie, status)) return true;
 if(audience!=='personal'||paths.get(new URL(request.url).pathname)!==request.method)return false;
 return /^__Host-falcon_spaces=(?:[A-Za-z0-9_-]{43})?;/.test(cookie)&&!/;\s*domain\s*=/i.test(cookie)&&
  /;\s*path=\/(?:;|$)/i.test(cookie)&&/;\s*secure(?:;|$)/i.test(cookie)&&/;\s*httponly(?:;|$)/i.test(cookie)&&
  /;\s*samesite=lax(?:;|$)/i.test(cookie)&&/;\s*max-age=(?:0|300)(?:;|$)/i.test(cookie);
}
