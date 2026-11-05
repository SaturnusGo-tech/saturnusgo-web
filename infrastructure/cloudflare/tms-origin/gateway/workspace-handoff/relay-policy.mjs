import {companyHost} from '../company-host.mjs';
import {TMS_HOST} from '../../route-manifest.mjs';
export function workspaceHandoffOriginAllowed(origin,env) {
 try {const url=new URL(origin);return url.protocol==='https:'&&!url.port&&!url.username&&!url.password&&url.origin===origin&&
  (url.hostname===TMS_HOST||companyHost(url.hostname,env)==='tenant');}catch{return false;}
}
export function readWorkspaceHandoffPolicy(request,response,audience,env) {
 const path=new URL(request.url).pathname;
 const route=(request.method==='POST'&&(path==='/api/v1/auth/workspace-handoffs'||/^\/api\/v1\/auth\/saml\/[A-Za-z0-9._:-]{1,128}\/acs$/.test(path)))||(request.method==='GET'&&['/api/v1/auth/google/callback','/api/v1/auth/google/finish'].includes(path));
 if(!['tenant','personal'].includes(audience)||!route||response.status!==200||
  !/^text\/html(?:;|$)/i.test(response.headers.get('content-type')??''))return null;
 const policy=response.headers.get('content-security-policy')??'';
 const match=/^default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' (https:\/\/[^\s;,<>"'\\*]+); script-src 'nonce-([A-Za-z0-9_-]{32})'$/.exec(policy);
 return match&&workspaceHandoffOriginAllowed(match[1],env)?policy:null;
}
