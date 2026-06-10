export function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

export function withMessage(path: string, type: "ok" | "erro", message: string) {
  return `${path}?${type}=${encodeMessage(message)}`;
}

export function decodeMessage(message?: string) {
  return message ? decodeURIComponent(message) : null;
}
