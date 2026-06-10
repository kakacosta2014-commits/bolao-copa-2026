import { headers } from "next/headers";

function cleanBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export async function getBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredUrl) return cleanBaseUrl(configuredUrl);

  try {
    const headerStore = await headers();
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    if (!host) return "";
    const protocol = headerStore.get("x-forwarded-proto") ?? "https";
    return `${protocol}://${host}`;
  } catch {
    return "";
  }
}

export function buildAppUrl(baseUrl: string, path: string) {
  if (!baseUrl) return path;
  return `${cleanBaseUrl(baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;
}
