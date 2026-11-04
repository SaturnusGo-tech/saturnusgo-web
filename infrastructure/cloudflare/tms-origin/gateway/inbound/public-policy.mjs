import { TMS_HOST } from '../../route-manifest.mjs';

const auth = new Map([
 ['auth/entrypoint',['GET','HEAD']], ['auth/methods',['GET','HEAD']], ['auth/email/start',['POST']], ['auth/email/verify',['POST']], ['auth/email/resend',['POST']],
 ['auth/spaces',['GET']], ['auth/spaces/select',['POST']], ['auth/trial',['GET','HEAD']], ['auth/google/start',['POST']], ['auth/google/callback',['GET']],
 ['auth/google/finish',['GET']], ['auth/saml/start',['POST']], ['auth/federation/cancel',['POST']],
 ...['start','exchange','cancel'].map(name=>[`auth/desktop/${name}`,['POST']]), ['auth/desktop/authorize',['GET']],
 ['cloud-auth/session',['GET','HEAD']], ['cloud-auth/logout',['POST']],
]);
const business = /^(?:bootstrap|workspaces|projects|portfolios|environments|test-cases|shared-steps|suites|runs|defects|attachments|links|external-links|activity|dashboards|reports|repository-folders|folders|custom-fields|organization|notifications|profile|integrations|support)(?:\/[A-Za-z0-9._:-]+)*$/;
export function publicAuthEnabled(hostname,env) {
 return hostname===TMS_HOST && env?.FALCON_PUBLIC_AUTH_ENABLED==='true' && env?.FALCON_LEGACY_HOST_MANAGED!=='true';
}
export function publicApiAllowed(pathname,method) {
 if(!pathname.startsWith('/api/v1/')) return false;
 const path=pathname.slice('/api/v1/'.length); const methods=auth.get(path);
 if(methods) return methods.includes(method);
 return business.test(path) && ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'].includes(method);
}
