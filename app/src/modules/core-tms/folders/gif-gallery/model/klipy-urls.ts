import { KlipyError } from "./klipy-types";

export function klipyProviderUrl(input: unknown, hosts: readonly string[]) {
  if (typeof input !== "string" || input.length > 4096) throw new KlipyError("response");
  let url: URL; try { url = new URL(input); } catch { throw new KlipyError("response"); }
  if (url.protocol !== "https:" || !hosts.includes(url.hostname) || url.username || url.password ||
    url.hash || url.port && url.port !== "443") throw new KlipyError("response");
  return input;
}
export function klipyMediaUrl(input: unknown) {
  return klipyProviderUrl(input, ["static.klipy.com", "static1.klipy.com", "static2.klipy.com"]);
}
