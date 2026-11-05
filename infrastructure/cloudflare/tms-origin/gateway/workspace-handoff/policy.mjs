import {workspaceSessionRoutePolicy} from '../workspace-access/public-policy.mjs';
import {readWorkspaceHandoffPolicy} from './relay-policy.mjs';
const root='/api/v1/auth/';
const methods=new Map([['workspace-target',['GET']],['workspace-handoffs',['POST']],['workspace-handoffs/consume',['POST']]]);
export function workspaceHandoffRoutePolicy(pathname,audience) {
 if(!['personal','tenant'].includes(audience)||!pathname.startsWith(root))return null;
 const allowedMethods=methods.get(pathname.slice(root.length));
 return allowedMethods?{kind:'workspace-handoff',cookieNames:audience==='personal'?['__Host-falcon_tenant_session']:[],allowedMethods,allowServerPost:false,
  allowCrossSitePost:pathname===root+'workspace-handoffs/consume',maximumBodyBytes:8192}:null;
}
export function workspaceHandoffResponsePolicy(request,response,audience,env) {
 if(!["personal","tenant"].includes(audience))return null;
 const path=new URL(request.url).pathname;
 const callback=(request.method==='POST'&&/^\/api\/v1\/auth\/saml\/[A-Za-z0-9._:-]{1,128}\/acs$/.test(path))||(request.method==='GET'&&['/api/v1/auth/google/callback','/api/v1/auth/google/finish'].includes(path));
 const relay=readWorkspaceHandoffPolicy(request,response,audience,env),session=workspaceSessionRoutePolicy(path,audience);
 if(!workspaceHandoffRoutePolicy(path,audience)&&!relay&&!session&&!callback)return null;
 let allowRedirect=false;
 if(request.method==='POST'&&path===root+'workspace-handoffs/consume'&&response.status===303) {
  try {const location=response.headers.get('location'),url=new URL(location);
   allowRedirect=location.length<=2400&&url.origin===new URL(request.url).origin&&!url.username&&!url.password&&!url.hash&&
    url.pathname==='/testcases/umbrella-home/work/'&&!/[\\\x00-\x20\x7f]/.test(location)&&!/%0[ad]/i.test(location)&&
    ![...url.searchParams.keys()].some(key=>/token|code|secret|password|credential|authorization/i.test(key));
  }catch{}
 }
 return {allowRedirect,headers:[...(allowRedirect?['location']:[]),...(relay?['content-security-policy']:[])],permitsCookie(cookie) {
  const cookieRoute=(request.method==='POST'&&path===root+'workspace-handoffs/consume')||session||callback||(relay&&path!==root+'workspace-handoffs');
  if(!cookieRoute||!/^(?:__Host-falcon_cloud_session|__Host-falcon_tenant_session)=(?:[A-Za-z0-9_-]{43})?;/.test(cookie))return false;
  return !/;\s*domain\s*=/i.test(cookie)&&/;\s*path=\/(?:;|$)/i.test(cookie)&&/;\s*secure(?:;|$)/i.test(cookie)&&
   /;\s*httponly(?:;|$)/i.test(cookie)&&/;\s*samesite=lax(?:;|$)/i.test(cookie)&&(!/=;/.test(cookie)||/;\s*max-age=0(?:;|$)/i.test(cookie));
 }};
}
