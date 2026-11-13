'use client';
import type { ComponentProps } from 'react';
import { visitWorkspace } from '../../state/navigation/browser/workspace-history';
import { memberProfileUrl } from '../navigation/member-profile-route';
type Props=Omit<ComponentProps<'a'>,'href'>&{workspaceId:string;identityId:string};
export function MemberProfileLink({workspaceId,identityId,children,onClick,...props}:Props) {
 const href=memberProfileUrl(typeof window==='undefined'?'https://falcon.invalid/work/':window.location.href,workspaceId,identityId);
 return <a {...props} href={href} onClick={event=>{
  onClick?.(event);
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();event.stopPropagation();visitWorkspace(href);
 }}>{children}</a>;
}
