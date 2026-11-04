import { companyHost } from '../company-host.mjs';
import { TMS_HOST } from '../../route-manifest.mjs';

const federation=/^\/api\/v1\/auth\/(?:google\/(?:start|callback|finish|launch)|saml\/(?:start|launch)|saml\/[A-Za-z0-9._:-]{1,128}\/(?:acs|metadata)|federation\/cancel)$/;
export function federationRoutePolicy(pathname,audience) {
 if(!['tenant','platform','personal'].includes(audience)||!(federation.test(pathname)||pathname==='/api/v1/company/sso/test')) return null;
 return {kind:'inbound',allowServerPost:pathname.endsWith('/acs'),allowCrossSitePost:pathname.endsWith('/acs'),cookieNames:['__Host-falcon_federation',...(audience==='personal'&&pathname==='/api/v1/auth/federation/cancel'?['__Host-falcon_spaces']:[])],maximumBodyBytes:400000};
}
export function federationResponsePolicy(request,response,audience,env) {
 const path=new URL(request.url).pathname;
 if(!federationRoutePolicy(path,audience)) return null;
 const location=response.headers.get('location'); let allowRedirect=false;
 if(location&&[302,303].includes(response.status)) {
  try {
   const target=new URL(location,request.url);
   const starts=path.endsWith('/start')||path.endsWith('/launch');
   allowRedirect=target.protocol==='https:'&&!target.port&&!target.username&&!target.password&&!target.hash&&
    (starts||target.hostname===new URL(request.url).hostname||target.hostname===TMS_HOST||Boolean(companyHost(target.hostname,env)));
  } catch {}
 }
 return { allowRedirect, headers:allowRedirect?['location']:[], permitsCookie(cookie) {
  return /^__Host-falcon_federation=(?:[A-Za-z0-9_-]{43})?;/.test(cookie)&&! /;\s*domain\s*=/i.test(cookie)&&
   /;\s*path=\/(?:;|$)/i.test(cookie)&&/;\s*secure(?:;|$)/i.test(cookie)&&/;\s*httponly(?:;|$)/i.test(cookie)&&/;\s*samesite=none(?:;|$)/i.test(cookie)&&/;\s*max-age=(?:0|300)(?:;|$)/i.test(cookie);
 }};
}
