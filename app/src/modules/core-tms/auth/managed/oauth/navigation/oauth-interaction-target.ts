export function oauthInteractionTarget(search: string): string | null {
  const values = new URLSearchParams(search).getAll("falconMcpInteraction");
  if (values.length !== 1 || !/^[A-Za-z0-9_-]{1,128}$/.test(values[0])) return null;
  return `/api/v1/falcon-oauth/interaction/${values[0]}`;
}
