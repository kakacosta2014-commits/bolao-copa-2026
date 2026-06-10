"use server";

import { GameStatus } from "@prisma/client";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSession, clearAdminSession, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { withMessage } from "@/lib/messages";
import { calculateGamePredictionPoints } from "@/lib/scoring";
import { getSettings } from "@/lib/settings";
import { recalculateGame, recalculateSpecials } from "@/lib/recalculate";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function int(formData: FormData, key: string) {
  const value = Number.parseInt(text(formData, key), 10);
  if (Number.isNaN(value)) throw new Error(`Campo invalido: ${key}`);
  return value;
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

export async function registerParticipant(formData: FormData) {
  const name = text(formData, "name");
  const whatsapp = text(formData, "whatsapp");
  if (!name || !whatsapp) redirect(withMessage("/entrar", "erro", "Informe nome e WhatsApp."));

  let participant;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      participant = await prisma.participant.create({
        data: {
          name,
          whatsapp,
          accessToken: randomBytes(24).toString("hex")
        }
      });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }

  if (!participant) redirect(withMessage("/entrar", "erro", "Nao foi possivel criar seu acesso."));
  redirect(withMessage(`/participante/${participant.accessToken}`, "ok", "Cadastro realizado. Guarde este link para voltar depois."));
}

export async function loginAdmin(formData: FormData) {
  const password = text(formData, "password");
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    redirect(withMessage("/admin/login", "erro", "Senha invalida. Confira a senha do administrador."));
  }

  await createAdminSession();
  redirect(withMessage("/admin", "ok", "Login realizado com sucesso."));
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function setParticipantPaid(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const paid = text(formData, "paid") === "true";
  await prisma.participant.update({
    where: { id },
    data: { paid, paidAt: paid ? new Date() : null }
  });
  revalidatePath("/admin/participantes");
  revalidatePath("/ranking");
  redirect(withMessage("/admin/participantes", "ok", paid ? "Pagamento confirmado." : "Confirmacao de pagamento removida."));
}

export async function upsertGame(formData: FormData) {
  await requireAdmin();
  const id = optionalText(formData, "id");
  const data = {
    number: int(formData, "number"),
    stage: text(formData, "stage"),
    groupName: optionalText(formData, "groupName"),
    homeTeam: text(formData, "homeTeam"),
    awayTeam: text(formData, "awayTeam"),
    startsAt: new Date(text(formData, "startsAt")),
    status: text(formData, "status") as GameStatus
  };

  if (!data.stage || !data.homeTeam || !data.awayTeam || Number.isNaN(data.startsAt.getTime())) {
    redirect(withMessage("/admin/jogos", "erro", "Preencha os dados obrigatorios do jogo."));
  }

  if (id) {
    await prisma.game.update({ where: { id }, data });
  } else {
    await prisma.game.create({ data });
  }

  revalidatePath("/admin/jogos");
  revalidatePath("/");
  redirect(withMessage("/admin/jogos", "ok", id ? "Jogo atualizado." : "Jogo cadastrado."));
}

export async function deleteGame(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const predictions = await prisma.prediction.count({ where: { gameId: id } });
  if (predictions > 0) {
    redirect(withMessage("/admin/jogos", "erro", "Nao e possivel excluir jogo com palpites."));
  }
  await prisma.game.delete({ where: { id } });
  revalidatePath("/admin/jogos");
  redirect(withMessage("/admin/jogos", "ok", "Jogo excluido."));
}

export async function importGames(formData: FormData) {
  await requireAdmin();
  const lines = text(formData, "csv")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    redirect(withMessage("/admin/jogos", "erro", "Cole ao menos uma linha para importar."));
  }

  const errors: string[] = [];
  const validRows: Array<{
    number: number;
    stage: string;
    groupName: string | null;
    homeTeam: string;
    awayTeam: string;
    startsAt: Date;
  }> = [];

  lines.forEach((line, index) => {
    const [number, stage, groupName, homeTeam, awayTeam, startsAt] = line.split(";");
    const parsedNumber = Number(number);
    const parsedDate = new Date(startsAt ?? "");

    if (
      line.split(";").length !== 6 ||
      !Number.isInteger(parsedNumber) ||
      !stage?.trim() ||
      !homeTeam?.trim() ||
      !awayTeam?.trim() ||
      Number.isNaN(parsedDate.getTime())
    ) {
      errors.push(`Linha ${index + 1}: formato invalido.`);
      return;
    }

    validRows.push({
      number: parsedNumber,
      stage: stage.trim(),
      groupName: groupName?.trim() || null,
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
      startsAt: parsedDate
    });
  });

  if (errors.length > 0) {
    redirect(withMessage("/admin/jogos", "erro", errors.join(" ")));
  }

  for (const row of validRows) {
    await prisma.game.upsert({
      where: { number: row.number },
      create: {
        number: row.number,
        stage: row.stage,
        groupName: row.groupName,
        homeTeam: row.homeTeam,
        awayTeam: row.awayTeam,
        startsAt: row.startsAt
      },
      update: {
        stage: row.stage,
        groupName: row.groupName,
        homeTeam: row.homeTeam,
        awayTeam: row.awayTeam,
        startsAt: row.startsAt
      }
    });
  }

  revalidatePath("/admin/jogos");
  redirect(withMessage("/admin/jogos", "ok", `Importacao concluida: ${validRows.length} jogo(s) importado(s) ou atualizado(s).`));
}

export async function savePrediction(formData: FormData) {
  const token = text(formData, "token");
  const participantPath = `/participante/${token}`;
  const participant = await prisma.participant.findUnique({ where: { accessToken: token } });
  if (!participant) redirect(withMessage("/", "erro", "Participante nao encontrado."));
  if (!participant.paid) redirect(withMessage(participantPath, "erro", "Pagamento ainda nao confirmado."));

  const gameId = text(formData, "gameId");
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { goalScorers: true }
  });
  if (!game) redirect(withMessage(participantPath, "erro", "Jogo nao encontrado."));
  if (game.startsAt <= new Date()) {
    redirect(withMessage(participantPath, "erro", "Palpite bloqueado apos o inicio do jogo."));
  }

  const points = calculateGamePredictionPoints({
    predictedHomeScore: int(formData, "predictedHomeScore"),
    predictedAwayScore: int(formData, "predictedAwayScore"),
    predictedGoalScorer: optionalText(formData, "predictedGoalScorer"),
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    goalScorers: game.goalScorers.map((scorer) => scorer.playerName)
  });

  await prisma.prediction.upsert({
    where: { participantId_gameId: { participantId: participant.id, gameId } },
    create: {
      participantId: participant.id,
      gameId,
      predictedHomeScore: int(formData, "predictedHomeScore"),
      predictedAwayScore: int(formData, "predictedAwayScore"),
      predictedGoalScorer: optionalText(formData, "predictedGoalScorer"),
      ...points
    },
    update: {
      predictedHomeScore: int(formData, "predictedHomeScore"),
      predictedAwayScore: int(formData, "predictedAwayScore"),
      predictedGoalScorer: optionalText(formData, "predictedGoalScorer"),
      ...points
    }
  });

  revalidatePath(`/participante/${token}`);
  revalidatePath("/ranking");
  redirect(withMessage(participantPath, "ok", "Palpite salvo com sucesso."));
}

export async function saveSpecialPrediction(formData: FormData) {
  const settings = await getSettings();
  const token = text(formData, "token");
  const participantPath = `/participante/${token}`;
  if (settings.specialPredictionsLocked) {
    redirect(withMessage(participantPath, "erro", "Palpites especiais bloqueados pelo administrador."));
  }

  const participant = await prisma.participant.findUnique({ where: { accessToken: token } });
  if (!participant) redirect(withMessage("/", "erro", "Participante nao encontrado."));
  if (!participant.paid) redirect(withMessage(participantPath, "erro", "Pagamento ainda nao confirmado."));

  const championTeam = text(formData, "championTeam");
  const topScorerPlayer = text(formData, "topScorerPlayer");
  if (!championTeam || !topScorerPlayer) {
    redirect(withMessage(participantPath, "erro", "Informe campeao e artilheiro."));
  }

  await prisma.specialPrediction.upsert({
    where: { participantId: participant.id },
    create: { participantId: participant.id, championTeam, topScorerPlayer },
    update: { championTeam, topScorerPlayer }
  });

  revalidatePath(`/participante/${token}`);
  redirect(withMessage(participantPath, "ok", "Palpites especiais salvos."));
}

export async function saveResult(formData: FormData) {
  await requireAdmin();
  const gameId = text(formData, "gameId");
  const scorers = text(formData, "goalScorers")
    .split(/\r?\n|,/)
    .map((name) => name.trim())
    .filter(Boolean);

  await prisma.game.update({
    where: { id: gameId },
    data: {
      homeScore: int(formData, "homeScore"),
      awayScore: int(formData, "awayScore"),
      status: "ENCERRADO",
      goalScorers: {
        deleteMany: {},
        create: scorers.map((playerName) => ({ playerName }))
      }
    }
  });

  await recalculateGame(gameId);
  revalidatePath("/admin/resultados");
  revalidatePath("/ranking");
  redirect(withMessage("/admin/resultados", "ok", "Resultado salvo e pontuacao recalculada."));
}

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const percentages = {
    organizerPercentage: Number(text(formData, "organizerPercentage")),
    firstPlacePercentage: Number(text(formData, "firstPlacePercentage")),
    secondPlacePercentage: Number(text(formData, "secondPlacePercentage")),
    thirdPlacePercentage: Number(text(formData, "thirdPlacePercentage"))
  };
  const sum = Object.values(percentages).reduce((acc, value) => acc + value, 0);
  if (Math.abs(sum - 100) > 0.001) {
    redirect(withMessage("/admin/configuracoes", "erro", "A soma dos percentuais deve ser 100%."));
  }

  const settings = await getSettings();
  await prisma.settings.update({
    where: { id: settings.id },
    data: {
      poolName: text(formData, "poolName"),
      entryFee: Number(text(formData, "entryFee")),
      pixKey: text(formData, "pixKey"),
      pixReceiverName: text(formData, "pixReceiverName"),
      organizerWhatsapp: text(formData, "organizerWhatsapp"),
      ...percentages
    }
  });

  revalidatePath("/admin/configuracoes");
  revalidatePath("/");
  revalidatePath("/ranking");
  redirect(withMessage("/admin/configuracoes", "ok", "Configuracoes salvas."));
}

export async function saveSpecialAdmin(formData: FormData) {
  await requireAdmin();
  const settings = await getSettings();
  await prisma.settings.update({
    where: { id: settings.id },
    data: {
      specialPredictionsLocked: text(formData, "specialPredictionsLocked") === "on",
      officialChampion: optionalText(formData, "officialChampion"),
      officialTopScorers: optionalText(formData, "officialTopScorers")
    }
  });

  await recalculateSpecials();
  revalidatePath("/admin/especiais");
  revalidatePath("/ranking");
  redirect(withMessage("/admin/especiais", "ok", "Palpites especiais atualizados e recalculados."));
}
