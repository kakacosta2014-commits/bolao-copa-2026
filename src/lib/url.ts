import { headers } from "next/headers";

function cleanBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function isLocalHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function getHost(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

export async function getBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  try {
    const headerStore = await headers();
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") ?? "https";
    const requestHost = host?.split(":")[0] ?? "";

    if (host && !isLocalHost(requestHost)) {
      return `${protocol}://${host}`;
    }

    if (configuredUrl) {
      const configuredHost = getHost(configuredUrl);

      if (!configuredHost || !host) return cleanBaseUrl(configuredUrl);
      if (isLocalHost(configuredHost) && !isLocalHost(requestHost)) {
        return `${protocol}://${host}`;
      }

      return cleanBaseUrl(configuredUrl);
    }

    if (!host) {
      const vercelUrl = process.env.VERCEL_URL?.trim();
      return vercelUrl ? `https://${cleanBaseUrl(vercelUrl)}` : "";
    }

    return `${protocol}://${host}`;
  } catch {
    if (configuredUrl) return cleanBaseUrl(configuredUrl);
    const vercelUrl = process.env.VERCEL_URL?.trim();
    if (vercelUrl) return `https://${cleanBaseUrl(vercelUrl)}`;
    return "";
  }
}

export function buildAppUrl(baseUrl: string, path: string) {
  if (!baseUrl) return path;
  return `${cleanBaseUrl(baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;
}
