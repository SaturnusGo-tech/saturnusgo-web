export function authorizeSwaggerRequest<T extends { url: string; credentials?: string }>(request: T, falconOrigin: string): T {
  const url = new URL(request.url);
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || url.origin === falconOrigin ||
    hostname === "validator.swagger.io" || hostname === "api.tms.saturnusgo.com" || hostname.endsWith(".auth0.com") ||
    /(?:^|\.)(?:localhost|local|internal|lan)$/.test(hostname) ||
    /^(?:127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(hostname) || hostname.startsWith("[")) {
    throw new Error("Swagger requests require a public HTTPS API server outside Falcon. Check the specification servers.");
  }
  return { ...request, credentials: "omit" };
}
