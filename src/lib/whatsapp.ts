export function onlyDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function buildWhatsAppLink(phone: string, message: string) {
  const digits = onlyDigits(phone);
  if (!digits) return null;
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
