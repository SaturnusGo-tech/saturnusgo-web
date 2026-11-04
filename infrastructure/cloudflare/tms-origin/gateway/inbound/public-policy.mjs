import { TMS_HOST } from '../../route-manifest.mjs';

const auth = new Map([
 ['auth/entrypoint',['GET','HEAD']], ['auth/methods',['GET','HEAD']], ['auth/email/start',['POST']], ['auth/email/verify',['POST']], ['auth/email/resend',['POST']],
 ['auth/spaces',['GET']], ['auth/spaces/select',['POST']], ['auth/trial',['GET','HEAD']], ['auth/google/start',['POST']], ['auth/google/callback',['GET']],
 ['auth/google/finish',['GET']], ['auth/saml/start',['POST']], ['auth/federation/cancel',['POST']],
 ...['start','exchange','cancel'].map(name=>[`auth/desktop/${name}`,['POST']]), ['auth/desktop/authorize',['GET']],
 ['cloud-auth/session',['GET','HEAD']], ['cloud-auth/logout',['POST']],
]);
const personalProfile = new Map([
 ['me/profile',['GET','PATCH']], ['me/profile/activity',['GET']],
 ['me/profile/avatar',['POST','DELETE']], ['me/profile/banner',['POST','DELETE']],
]);
const personalFeatures = new Map([
 ...['summary','test-cases','runs','run-items','defects'].map(name=>[`dashboard-analytics/${name}`,'GET']),
 ['execution-history','GET'], ['test-case-import/inspect','POST'], ['test-case-import/normalize','POST'],
 ['impact/repositories','GET'], ['impact/analyses','GET'],
]);
const impactResource = /^impact\/analyses\/[A-Za-z0-9._:-]{1,128}$/;
const impactRepository = /^impact\/repositories\/[A-Za-z0-9._:-]{1,128}$/;
const impactCommand = /^impact\/analyses\/[A-Za-z0-9._:-]{1,128}\/(?:scope|approve|retry|gaps\/[A-Za-z0-9._:-]{1,128}\/(?:generate|acknowledge))$/;
const business = /^(?:bootstrap|workspaces|projects|portfolios|environments|test-cases|shared-steps|suites|runs|defects|attachments|links|external-links|activity|dashboards|reports|repository-folders|folders|custom-fields|organization|notifications|profile|integrations|support)(?:\/[A-Za-z0-9._:-]+)*$/;
export function publicAuthEnabled(hostname,env) {
 return hostname===TMS_HOST && env?.FALCON_PUBLIC_AUTH_ENABLED==='true' && env?.FALCON_LEGACY_HOST_MANAGED!=='true';
}
export function publicApiAllowed(pathname,method) {
 if(!pathname.startsWith('/api/v1/')) return false;
 const path=pathname.slice('/api/v1/'.length); const methods=auth.get(path) ?? personalProfile.get(path);
 if(methods) return methods.includes(method);
 if(personalFeatures.get(path)===method || (method==='GET' && impactResource.test(path)) ||
  (method==='PATCH' && impactRepository.test(path)) || (method==='POST' && impactCommand.test(path))) return true;
 return business.test(path) && ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'].includes(method);
}
