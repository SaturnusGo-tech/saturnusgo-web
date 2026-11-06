import {workspaceSessionRoutePolicy} from '../workspace-access/public-policy.mjs';
import {readWorkspaceHandoffPolicy} from './relay-policy.mjs';
import {APP_PATH,LEGACY_APP_PATH,TMS_HOST} from '../../route-manifest.mjs';
const root='/api/v1/auth/';
const methods=new Map([['workspace-target',['GET']],['workspace-handoffs',['POST']],['workspace-handoffs/consume',['POST']]]);
export function workspaceHandoffRoutePolicy(pathname,audience) {
 if(!['personal','tenant'].includes(audience)||!pathname.startsWith(root))return null;
 const allowedMethods=methods.get(pathname.slice(root.length));
 return allowedMethods?{kind:'workspace-handoff',cookieNames:audience==='personal'?['__Host-falcon_tenant_session']:[],allowedMethods,allowServerPost:false,
  allowCrossSitePost:pathname===root+'workspace-handoffs/consume',maximumBodyBytes:8192}:null;
}
function companyAdministrationRedirect(url) {
 const keys=[...url.searchParams.keys()],workspaceId=url.searchParams.get('workspaceId'),projectId=url.searchParams.get('projectId'),lang=url.searchParams.get('lang');
 return url.pathname==='/admin/'&&url.searchParams.get('account')==='personal'&&url.searchParams.get('page')==='company'&&
  /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(workspaceId??'')&&
  keys.every(key=>['account','workspaceId','page','projectId','lang'].includes(key)&&url.searchParams.getAll(key).length===1)&&
  (projectId===null||/^[A-Za-z0-9._:-]{1,128}$/.test(projectId))&&(lang===null||['en','ru'].includes(lang));
}
function companyPreparationRedirect(request,response,url) {
 const keys=[...url.searchParams.keys()];
 return request.headers.get('accept')?.includes('text/html')&&!response.headers.has('set-cookie')&&
  url.origin===`https://${TMS_HOST}`&&url.pathname==='/cloud-login/'&&keys.length===2&&
  keys.every(key=>['workspaceId','workspaceHandoff'].includes(key)&&url.searchParams.getAll(key).length===1)&&
  /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(url.searchParams.get('workspaceId')??'')&&url.searchParams.get('workspaceHandoff')==='1';
}
function desktopAuthorizationRedirect(url) {
 const keys=[...url.searchParams.keys()];
 return url.pathname==='/api/v1/auth/desktop/authorize'&&keys.length===2&&
  keys.every(key=>['attempt','workspaceId'].includes(key)&&url.searchParams.getAll(key).length===1)&&
  /^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get('attempt')??'')&&
  /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(url.searchParams.get('workspaceId')??'');
}
export function workspaceHandoffResponsePolicy(request,response,audience,env) {
 if(!["personal","tenant"].includes(audience))return null;
 const path=new URL(request.url).pathname;
 const callback=(request.method==='POST'&&/^\/api\/v1\/auth\/saml\/[A-Za-z0-9._:-]{1,128}\/acs$/.test(path))||(request.method==='GET'&&['/api/v1/auth/google/callback','/api/v1/auth/google/finish'].includes(path));
 const relay=readWorkspaceHandoffPolicy(request,response,audience,env),session=workspaceSessionRoutePolicy(path,audience);
 if(!workspaceHandoffRoutePolicy(path,audience)&&!relay&&!session&&!callback)return null;
 let allowRedirect=false;
 if(request.method==='POST'&&[root+'workspace-handoffs',root+'workspace-handoffs/consume'].includes(path)&&response.status===303) {
  try {const location=response.headers.get('location'),url=new URL(location);
   const safe=location.length<=2400&&!url.username&&!url.password&&!url.hash&&!/[\\\x00-\x20\x7f]/.test(location)&&!/%0[ad]/i.test(location)&&
    ![...url.searchParams.keys()].some(key=>/token|code|secret|password|credential|authorization/i.test(key));
   allowRedirect=safe&&(companyPreparationRedirect(request,response,url)||(path===root+'workspace-handoffs/consume'&&
    url.origin===new URL(request.url).origin&&([APP_PATH,LEGACY_APP_PATH].includes(url.pathname)||companyAdministrationRedirect(url)||desktopAuthorizationRedirect(url))));
  }catch{}
 }
 return {allowRedirect,headers:[...(allowRedirect?['location']:[]),...(relay?['content-security-policy']:[])],permitsCookie(cookie) {
  const cookieRoute=(request.method==='POST'&&path===root+'workspace-handoffs/consume')||session||callback||(relay&&path!==root+'workspace-handoffs');
  if(!cookieRoute||!/^(?:__Host-falcon_cloud_session|__Host-falcon_tenant_session)=(?:[A-Za-z0-9_-]{43})?;/.test(cookie))return false;
  return !/;\s*domain\s*=/i.test(cookie)&&/;\s*path=\/(?:;|$)/i.test(cookie)&&/;\s*secure(?:;|$)/i.test(cookie)&&
   /;\s*httponly(?:;|$)/i.test(cookie)&&/;\s*samesite=lax(?:;|$)/i.test(cookie)&&(!/=;/.test(cookie)||/;\s*max-age=0(?:;|$)/i.test(cookie));
 }};
}
