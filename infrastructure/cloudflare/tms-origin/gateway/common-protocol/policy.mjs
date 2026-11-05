const issuer='/api/v1/falcon-oauth';
const posts=new Set(['/token','/reg','/token/revocation']);
const reads=new Set(['/jwks','/.well-known/openid-configuration','/.well-known/oauth-authorization-server','/connections']);
export function centralProtocolMethods(pathname) {
 if(pathname==='/api/v1/mcp')return ['GET','POST','DELETE','OPTIONS'];
 if(pathname==='/api/v1/mcp/resource-metadata')return ['GET','HEAD'];
 if(!pathname.startsWith(issuer+'/'))return null;
 const path=pathname.slice(issuer.length);
 if(posts.has(path)||/^\/connections\/[A-Za-z0-9_-]{1,128}\/revoke$/.test(path))return ['POST','OPTIONS'];
 if(reads.has(path))return ['GET','HEAD','OPTIONS'];
 if(path==='/auth'||/^\/(?:auth|interaction)\/[A-Za-z0-9_-]{1,128}$/.test(path))return ['GET','POST','OPTIONS'];
 return null;
}
