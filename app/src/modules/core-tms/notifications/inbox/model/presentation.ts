/** Only workspace-owned application links can enter client-side navigation. */
export function notificationHref(value: string, current: string, workspaceId: string): string | null {
  try {
    const base = new URL(current), target = new URL(value, base);
    if (!workspaceId || !['http:', 'https:'].includes(base.protocol) || !['http:', 'https:'].includes(target.protocol) || target.username || target.password
      || target.searchParams.getAll('workspaceId').length !== 1
      || target.pathname !== '/testcases/umbrella-home/work/'
      || target.searchParams.get('workspaceId') !== workspaceId
      || (target.origin !== base.origin && target.origin !== 'https://tms.saturnusgo.com')) return null;
    target.protocol = base.protocol; target.host = base.host;
    return target.href;
  } catch { return null; }
}

export function notificationTime(value: string, locale: "ru" | "en", now = Date.now()): string {
  const date = new Date(value), seconds = Math.max(0, (now - date.getTime()) / 1000);
  if (!Number.isFinite(seconds)) return '';
  if (seconds < 60) return locale === 'ru' ? 'Только что' : 'Just now';
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (seconds < 3600) return format.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 86400) return format.format(-Math.floor(seconds / 3600), 'hour');
  if (seconds < 604800) return format.format(-Math.floor(seconds / 86400), 'day');
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
}
