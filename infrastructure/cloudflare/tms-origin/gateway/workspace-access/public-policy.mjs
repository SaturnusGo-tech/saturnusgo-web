const paths=new Map([
 ['billing',['GET']],['billing/plans',['GET']],['billing/summary',['GET']],['billing/invoices',['GET']],
 ...['checkout','confirm','subscription','retry','mock/outcome'].map(name=>['billing/'+name,['POST']]),
 ['billing/startup-setup',['GET','PUT']],['billing/startup-setup/retry',['POST']],['codex/setup',['GET']],
 ['auth/workspace-target',['GET']],['auth/workspace-handoffs',['POST']],['auth/workspace-handoffs/consume',['POST']],
 ['auth/session',['GET']],['auth/logout',['POST']],['auth/password/first',['POST']],
 ['auth/mfa/enroll',['POST']],['auth/mfa/verify',['POST']],['auth/mfa/recovery',['POST']],
 ['company',['GET']],['company/audit',['GET']],['company/members',['GET','POST']],
 ['company/domain',['GET']],['company/domain/restore',['POST']],['company/agents/codex',['GET']],
 ['company/agents/codex/activate',['POST']],['company/agents/codex/deactivate',['POST']],['company/agents/codex/connections',['GET']],
]);
export function publicWorkspaceAccessAllowed(path,method) {
 const allowed=paths.get(path);if(allowed)return allowed.includes(method);
 if(/^company\/members\/[A-Za-z0-9._:-]{1,128}$/.test(path))return ['GET','PATCH'].includes(method);
 if(/^company\/agents\/codex\/connections\/[A-Za-z0-9._:-]{1,128}\/revoke$/.test(path))return method==='POST';
 if(/^auth\/saml\/[A-Za-z0-9._:-]{1,128}\/acs$/.test(path))return method==='POST';
 if(/^auth\/saml\/[A-Za-z0-9._:-]{1,128}\/metadata$/.test(path))return ['GET','HEAD'].includes(method);
 return false;
}

const sessionMethods=new Map([['/api/v1/auth/session',['GET']],...['logout','password/first','mfa/enroll','mfa/verify','mfa/recovery'].map(path=>['/api/v1/auth/'+path,['POST']])]);
export function workspaceSessionRoutePolicy(pathname,audience) {
 const allowedMethods=audience==='personal'?sessionMethods.get(pathname):null;
 return allowedMethods?{kind:'workspace-session',cookieNames:['__Host-falcon_tenant_session'],allowedMethods,allowServerPost:false,maximumBodyBytes:8192}:null;
}
