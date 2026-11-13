'use client';
import type { ComponentProps } from 'react';
import { visitWorkspace } from '../../state/navigation/browser/workspace-history';
import { teamUrl } from '../navigation/team-route';
type Props = Omit<ComponentProps<'a'>, 'href'>;
export function TeamLink({children,onClick,...props}: Props) {
  const href = teamUrl(typeof window === 'undefined' ? 'https://falcon.invalid/work/' : window.location.href);
  return <a {...props} href={href} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); visitWorkspace(href);
  }}>{children}</a>;
}
