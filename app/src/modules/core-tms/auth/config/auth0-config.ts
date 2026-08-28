export interface TmsAuth0Environment {
  readonly NEXT_PUBLIC_AUTH0_DOMAIN?: string;
  readonly NEXT_PUBLIC_AUTH0_CLIENT_ID?: string;
  readonly NEXT_PUBLIC_AUTH0_AUDIENCE?: string;
}

export interface TmsAuth0Configuration {
  readonly domain: string;
  readonly clientId: string;
  readonly audience: string;
}

export type TmsAuth0ConfigurationResult =
  | { readonly ok: true; readonly value: TmsAuth0Configuration }
  | { readonly ok: false; readonly reason: "missing" | "invalid" };

const domainPattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const clientIdPattern = /^[A-Za-z0-9_-]{8,256}$/;
const audiencePattern = /^\S{1,2048}$/;

function exact(value: string | undefined): string | null {
  if (!value || value !== value.trim()) return null;
  return value;
}

export function readTmsAuth0Configuration(
  environment: TmsAuth0Environment,
): TmsAuth0ConfigurationResult {
  const domain = exact(environment.NEXT_PUBLIC_AUTH0_DOMAIN);
  const clientId = exact(environment.NEXT_PUBLIC_AUTH0_CLIENT_ID);
  const audience = exact(environment.NEXT_PUBLIC_AUTH0_AUDIENCE);
  if (!domain || !clientId || !audience) return { ok: false, reason: "missing" };
  if (
    !domainPattern.test(domain) ||
    !clientIdPattern.test(clientId) ||
    !audiencePattern.test(audience)
  ) {
    return { ok: false, reason: "invalid" };
  }
  return {
    ok: true,
    value: Object.freeze({ domain: domain.toLowerCase(), clientId, audience }),
  };
}
