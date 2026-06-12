const teamFlags: Record<string, string> = {
  "africa do sul": "🇿🇦",
  albania: "🇦🇱",
  alemanha: "🇩🇪",
  argelia: "🇩🇿",
  argentina: "🇦🇷",
  "arabia saudita": "🇸🇦",
  australia: "🇦🇺",
  austria: "🇦🇹",
  belgica: "🇧🇪",
  bolivia: "🇧🇴",
  "bosnia e herzegovina": "🇧🇦",
  brasil: "🇧🇷",
  "cabo verde": "🇨🇻",
  camaroes: "🇨🇲",
  canada: "🇨🇦",
  catar: "🇶🇦",
  chile: "🇨🇱",
  china: "🇨🇳",
  colombia: "🇨🇴",
  "coreia do sul": "🇰🇷",
  "costa do marfim": "🇨🇮",
  "costa rica": "🇨🇷",
  croacia: "🇭🇷",
  curacao: "🇨🇼",
  dinamarca: "🇩🇰",
  egito: "🇪🇬",
  equador: "🇪🇨",
  escocia: "🏴",
  eslovaquia: "🇸🇰",
  eslovenia: "🇸🇮",
  espanha: "🇪🇸",
  "estados unidos": "🇺🇸",
  franca: "🇫🇷",
  gana: "🇬🇭",
  grecia: "🇬🇷",
  haiti: "🇭🇹",
  holanda: "🇳🇱",
  honduras: "🇭🇳",
  inglaterra: "🏴",
  ira: "🇮🇷",
  iraque: "🇮🇶",
  irlanda: "🇮🇪",
  islandia: "🇮🇸",
  italia: "🇮🇹",
  japao: "🇯🇵",
  marrocos: "🇲🇦",
  mexico: "🇲🇽",
  nigeria: "🇳🇬",
  noruega: "🇳🇴",
  "nova zelandia": "🇳🇿",
  "pais de gales": "🏴",
  "paises baixos": "🇳🇱",
  panama: "🇵🇦",
  paraguai: "🇵🇾",
  peru: "🇵🇪",
  polonia: "🇵🇱",
  portugal: "🇵🇹",
  "republica tcheca": "🇨🇿",
  servia: "🇷🇸",
  senegal: "🇸🇳",
  suecia: "🇸🇪",
  suica: "🇨🇭",
  tchequia: "🇨🇿",
  tunisia: "🇹🇳",
  turquia: "🇹🇷",
  ucrania: "🇺🇦",
  uruguai: "🇺🇾",
  uzbequistao: "🇺🇿",
  venezuela: "🇻🇪"
};

function normalizeTeamName(teamName: string) {
  return teamName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function getTeamFlag(teamName: string): string | null {
  const normalized = normalizeTeamName(teamName);
  return teamFlags[normalized] ?? null;
}

export function formatTeamWithFlag(teamName: string): string {
  const flag = getTeamFlag(teamName);
  return flag ? `${flag} ${teamName}` : teamName;
}
