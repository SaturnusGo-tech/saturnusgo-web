import {isSessionCookieExpiry} from '../session-cookie-expiry.mjs';

const root='/api/v1/auth/desktop/';
const methods=new Map([['start',['POST']],['authorize',['GET']],['exchange',['POST']],['redeem',['POST']],['cancel',['POST']]]);
export function desktopRoutePolicy(pathname,audience) {
 if(!['personal','tenant'].includes(audience)||!pathname.startsWith(root))return null;
 const allowedMethods=methods.get(pathname.slice(root.length));
 const cookieNames=audience==='personal'&&pathname===root+'authorize'?['__Host-falcon_tenant_session']:[];
 return allowedMethods?{kind:'desktop',cookieNames,allowServerPost:false,allowedMethods}:null;
}
export function desktopResponsePolicy(request,response,audience) {
 const path=new URL(request.url).pathname;
 if(!desktopRoutePolicy(path,audience))return null;
 const location=response.headers.get('location');let allowRedirect=false;
 if(request.method==='GET'&&path===`${root}authorize`&&response.status===303&&location){
  try{
   const target=new URL(location);
   allowRedirect=target.protocol==='http:'&&target.hostname==='127.0.0.1'&&Number(target.port)>=1024&&Number(target.port)<=65535&&
    !target.username&&!target.password&&!target.hash&&target.pathname==='/falcon-auth/callback'&&target.toString()===location&&
    [...target.searchParams.keys()].sort().join(',')==='code,state'&&/^[A-Za-z0-9_-]{43}$/.test(target.searchParams.get('code')??'')&&
    /^[A-Za-z0-9_-]{22,128}$/.test(target.searchParams.get('state')??'');
  }catch{}
 }
 const completesSession=request.method==='POST'&&response.status===204&&(path===root+'exchange'||path===root+'redeem');
 return {allowRedirect,headers:allowRedirect?['location']:[],permitsCookie:cookie=>completesSession&&
  ['__Host-falcon_cloud_session','__Host-falcon_tenant_session'].some(name=>isSessionCookieExpiry(cookie,name))};
}
