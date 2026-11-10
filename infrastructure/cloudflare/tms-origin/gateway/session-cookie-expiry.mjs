export function isSessionCookieExpiry(cookie, name) {
  const [value, ...parts] = cookie.split(";").map(part => part.trim());
  if (value !== `${name}=`) return false;
  const attributes = new Set(parts.map(part => part.toLowerCase()));
  const allowed = ["path=/", "max-age=0", "httponly", "secure", "samesite=lax"];
  const epoch = "expires=thu, 01 jan 1970 00:00:00 gmt";
  if (attributes.has(epoch)) allowed.push(epoch);
  return parts.length === allowed.length && attributes.size === allowed.length &&
    allowed.every(attribute => attributes.has(attribute));
}
