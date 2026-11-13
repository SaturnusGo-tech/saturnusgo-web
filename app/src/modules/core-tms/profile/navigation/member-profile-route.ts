import { workspaceProfileUrl } from './profile-route';
const stableId=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
export function memberProfileUrl(href:string,workspaceId:string,identityId:string):string {
 const source=new URL(href),url=new URL(workspaceProfileUrl(href),source.origin);
 if(!stableId.test(workspaceId)||!stableId.test(identityId))return workspaceProfileUrl(href);
 if(source.searchParams.get('workspaceId')!==workspaceId)url.searchParams.delete('projectId');
 url.searchParams.set('workspaceId',workspaceId);url.searchParams.set('memberId',identityId);
 return `${url.pathname}${url.search}`;
}
export function readMemberProfileIdentity(href:string,workspaceId:string):string|null {
 const query=new URL(href).searchParams,value=query.get('memberId');
 return query.get('view')==='profile'&&query.get('workspaceId')===workspaceId&&value&&stableId.test(value)?value:null;
}
