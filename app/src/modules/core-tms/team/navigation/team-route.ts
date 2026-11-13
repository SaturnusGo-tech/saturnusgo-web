import { workspaceProfileUrl } from '../../profile/navigation/profile-route';
export function teamUrl(href: string): string {
  const url = new URL(workspaceProfileUrl(href), new URL(href).origin);
  url.searchParams.set('view', 'team');
  return `${url.pathname}${url.search}`;
}
