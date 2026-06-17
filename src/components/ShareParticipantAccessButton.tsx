"use client";

type ShareParticipantAccessButtonProps = {
  participantName: string;
  participantWhatsapp: string | null;
  accessUrl: string;
};

function normalizeBrazilWhatsapp(value: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");

  if (digits.startsWith("55") && digits.length >= 12) {
    return digits;
  }

  if (!digits.startsWith("55") && digits.length >= 10) {
    return `55${digits}`;
  }

  return "";
}

function buildAccessMessage(participantName: string, accessUrl: string) {
  return [
    `Ola, ${participantName}!`,
    "",
    "Aqui esta seu acesso ao Bolao Copa 2026:",
    "",
    accessUrl,
    "",
    "Guarde esse link para fazer seus palpites, acompanhar suas disputas e ver o ranking.",
    "",
    "Voce tambem pode instalar o Bolao no celular como app pela tela inicial.",
    "",
    "Boa sorte!"
  ].join("\n");
}

export function ShareParticipantAccessButton({
  participantName,
  participantWhatsapp,
  accessUrl
}: ShareParticipantAccessButtonProps) {
  const phone = normalizeBrazilWhatsapp(participantWhatsapp);
  const message = buildAccessMessage(participantName, accessUrl);
  const whatsappUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <a className="button secondary share-access-button" href={whatsappUrl} target="_blank" rel="noreferrer">
      Compartilhar acesso
    </a>
  );
}
