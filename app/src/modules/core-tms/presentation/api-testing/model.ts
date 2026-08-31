export const UMBRELLA_API_SWAGGER_URL =
  "https://sieger-assistente-production.up.railway.app/docs#/";

export const POSTMAN_WEB_URL = "https://web.postman.co/";

export function swaggerFrameUrl(
  theme: "light" | "dark" | undefined,
  language: "en" | "ru",
): string {
  const target = new URL(UMBRELLA_API_SWAGGER_URL);
  if (theme) target.searchParams.set("theme", theme);
  target.searchParams.set("lang", language);
  return target.toString();
}
