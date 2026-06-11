export function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

const systemMessages = {
  participantDeleted: "Participante excluído.",
  participantDeleteBlockedPaid: "Não é possível excluir participante pago.",
  participantDeleteBlockedPredictions: "Não é possível excluir participante com palpites registrados.",
  participantNotFound: "Participante não encontrado."
} as const;

export type SystemMessageCode = keyof typeof systemMessages;

export function withMessage(path: string, type: "ok" | "erro", message: string) {
  return `${path}?${type}=${encodeMessage(message)}`;
}

export function withSystemMessage(path: string, type: "success" | "error", code: SystemMessageCode) {
  return `${path}?${type}=${code}`;
}

export function getSystemMessage(code?: string) {
  if (!code) return null;
  return systemMessages[code as SystemMessageCode] ?? null;
}

export function decodeMessage(message?: string) {
  return message ? decodeURIComponent(message) : null;
}
