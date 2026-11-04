const paths=new Map([
 ['/api/v1/auth/google/callback','GET'],['/api/v1/auth/email/verify','POST'],
 ['/api/v1/auth/spaces/select','POST'],['/api/v1/auth/federation/cancel','POST'],
]);
export function accountSpaceCookieAllowed(request,audience,cookie){
 if(audience!=='personal'||paths.get(new URL(request.url).pathname)!==request.method)return false;
 return /^__Host-falcon_spaces=(?:[A-Za-z0-9_-]{43})?;/.test(cookie)&&!/;\s*domain\s*=/i.test(cookie)&&
  /;\s*path=\/(?:;|$)/i.test(cookie)&&/;\s*secure(?:;|$)/i.test(cookie)&&/;\s*httponly(?:;|$)/i.test(cookie)&&
  /;\s*samesite=lax(?:;|$)/i.test(cookie)&&/;\s*max-age=(?:0|300)(?:;|$)/i.test(cookie);
}
