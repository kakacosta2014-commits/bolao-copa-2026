"use server";

import { GameStatus } from "@prisma/client";
import { randomBytes } from "crypto";
import { readFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { join } from "path";
import { createAdminSession, clearAdminSession, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { hasMultipleGoalScorers } from "@/lib/goalScorer";
import { withMessage, withSystemMessage } from "@/lib/messages";
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

function normalizeParticipantName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) {
    return digits.slice(2);
  }
  return digits;
}

type GameImportRow = {
  number: number;
  stage: string;
  groupName: string | null;
  homeTeam: string;
  awayTeam: string;
  startsAt: Date;
};

const gamesCsvHeader = "numero;fase;grupo;timeCasa;timeVisitante;dataHora";

function parseGamesCsv(csv: string) {
  const errors: string[] = [];
  const rows: GameImportRow[] = [];

  csv.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;
    if (index === 0 && line.toLowerCase() === gamesCsvHeader.toLowerCase()) return;

    const columns = line.split(";");
    const [number, stage, groupName, homeTeam, awayTeam, startsAt] = columns;
    const parsedNumber = Number(number);
    const parsedDate = new Date(startsAt ?? "");

    if (
      columns.length !== 6 ||
      !Number.isInteger(parsedNumber) ||
      parsedNumber <= 0 ||
      !stage?.trim() ||
      !homeTeam?.trim() ||
      !awayTeam?.trim() ||
      Number.isNaN(parsedDate.getTime())
    ) {
      errors.push(`Linha ${index + 1}: formato invalido.`);
      return;
    }

    rows.push({
      number: parsedNumber,
      stage: stage.trim(),
      groupName: groupName?.trim() || null,
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
      startsAt: parsedDate
    });
  });

  return { rows, errors };
}

async function importGameRows(rows: GameImportRow[]) {
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const existing = await prisma.game.findUnique({
      where: { number: row.number },
      select: { homeScore: true, awayScore: true, status: true }
    });

    if (!existing) {
      await prisma.game.create({
        data: {
          ...row,
          status: "AGENDADO"
        }
      });
      created += 1;
      continue;
    }

    const hasResult = existing.homeScore !== null || existing.awayScore !== null;
    await prisma.game.update({
      where: { number: row.number },
      data: {
        ...row,
        status: hasResult ? existing.status : "AGENDADO"
      }
    });
    updated += 1;
  }

  return { created, updated };
}

export async function registerParticipant(formData: FormData) {
  const name = text(formData, "name");
  const whatsapp = text(formData, "whatsapp");
  if (!name || !whatsapp) redirect(withMessage("/entrar", "erro", "Informe nome e WhatsApp."));

  const selectedDisputeIds = Array.from(
    new Set(
      formData
        .getAll("disputeIds")
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );

  if (selectedDisputeIds.length === 0) {
    redirect(withMessage("/entrar", "erro", "Escolha pelo menos uma disputa para participar."));
  }

  const activeDisputes = await prisma.dispute.findMany({
    where: {
      id: { in: selectedDisputeIds },
      isActive: true
    },
    select: { id: true }
  });

  if (activeDisputes.length !== selectedDisputeIds.length) {
    redirect(withMessage("/entrar", "erro", "Escolha apenas disputas ativas para participar."));
  }

  let participant;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      participant = await prisma.$transaction(async (tx) => {
        const created = await tx.participant.create({
          data: {
            name,
            whatsapp,
            accessToken: randomBytes(24).toString("hex")
          }
        });

        await tx.participantDispute.createMany({
          data: activeDisputes.map((dispute) => ({
            participantId: created.id,
            disputeId: dispute.id,
            paymentStatus: "PENDING",
            paidAt: null
          })),
          skipDuplicates: true
        });

        return created;
      });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }

  if (!participant) redirect(withMessage("/entrar", "erro", "Nao foi possivel criar seu acesso."));
  revalidatePath("/admin/disputas");
  redirect(withMessage(`/participante/${participant.accessToken}`, "ok", "Cadastro realizado. Guarde este link para voltar depois."));
}

export async function recoverParticipantAccess(formData: FormData) {
  const name = text(formData, "name");
  const whatsapp = text(formData, "whatsapp");

  if (!name || !whatsapp) {
    redirect(withMessage("/entrar", "erro", "Informe nome e WhatsApp cadastrados para recuperar seu acesso."));
  }

  const normalizedName = normalizeParticipantName(name);
  const normalizedWhatsapp = normalizeWhatsapp(whatsapp);

  if (!normalizedName || !normalizedWhatsapp) {
    redirect(withMessage("/entrar", "erro", "Informe nome e WhatsApp cadastrados para recuperar seu acesso."));
  }

  const participants = await prisma.participant.findMany({
    select: {
      name: true,
      whatsapp: true,
      accessToken: true
    }
  });

  const matches = participants.filter(
    (participant) =>
      normalizeParticipantName(participant.name) === normalizedName &&
      normalizeWhatsapp(participant.whatsapp) === normalizedWhatsapp
  );

  if (matches.length === 1) {
    redirect(`/participante/${matches[0].accessToken}`);
  }

  if (matches.length > 1) {
    redirect(withMessage("/entrar", "erro", "Encontramos mais de um cadastro parecido. Fale com o administrador para recuperar seu acesso."));
  }

  redirect(withMessage("/entrar", "erro", "Nao encontramos um cadastro com esses dados. Verifique o nome e WhatsApp ou fale com o administrador."));
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

export async function deleteParticipantAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "participantId");

  const participant = await prisma.participant.findUnique({
    where: { id },
    select: {
      id: true,
      paid: true,
      _count: { select: { predictions: true } },
      specialPrediction: { select: { id: true } }
    }
  });

  if (!participant) {
    redirect(withSystemMessage("/admin/participantes", "error", "participantNotFound"));
  }

  if (participant.paid) {
    redirect(withSystemMessage("/admin/participantes", "error", "participantDeleteBlockedPaid"));
  }

  if (participant._count.predictions > 0 || participant.specialPrediction) {
    redirect(withSystemMessage("/admin/participantes", "error", "participantDeleteBlockedPredictions"));
  }

  await prisma.participant.delete({ where: { id } });
  revalidatePath("/admin/participantes");
  revalidatePath("/ranking");
  redirect(withSystemMessage("/admin/participantes", "success", "participantDeleted"));
}

function adminParticipantRedirectPath(formData: FormData) {
  const redirectTo = text(formData, "redirectTo");
  return redirectTo === "/admin/disputas" ? redirectTo : "/admin/participantes";
}

export async function deletePendingParticipant(formData: FormData) {
  await requireAdmin();
  const participantId = text(formData, "participantId");
  const redirectTo = adminParticipantRedirectPath(formData);

  const result = await prisma.$transaction(async (tx) => {
    const participant = await tx.participant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        name: true,
        accessToken: true,
        paid: true,
        disputes: {
          select: {
            id: true,
            paymentStatus: true
          }
        },
        predictions: { select: { id: true } },
        specialPrediction: { select: { id: true } }
      }
    });

    if (!participant) {
      return { status: "notFound" as const };
    }

    const hasPaidDispute = participant.disputes.some((dispute) => dispute.paymentStatus === "PAID");
    if (participant.paid || hasPaidDispute) {
      return { status: "hasPaidDispute" as const, accessToken: participant.accessToken };
    }

    await tx.participantDispute.deleteMany({ where: { participantId: participant.id } });
    await tx.prediction.deleteMany({ where: { participantId: participant.id } });
    await tx.specialPrediction.deleteMany({ where: { participantId: participant.id } });
    await tx.participant.delete({ where: { id: participant.id } });

    return {
      status: "deleted" as const,
      accessToken: participant.accessToken,
      name: participant.name
    };
  });

  revalidatePath("/admin/disputas");
  revalidatePath("/admin/participantes");
  revalidatePath("/admin/ranking");
  revalidatePath("/ranking");

  if (result.status === "deleted") {
    revalidatePath(`/participante/${result.accessToken}`);
    redirect(withMessage(redirectTo, "ok", `Participante ${result.name} excluido com segurança.`));
  }

  if (result.status === "hasPaidDispute") {
    revalidatePath(`/participante/${result.accessToken}`);
    redirect(withMessage(redirectTo, "erro", "Este participante possui pagamento confirmado em outra disputa e nao pode ser excluido."));
  }

  redirect(withMessage(redirectTo, "erro", "Participante nao encontrado."));
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
  const csv = text(formData, "csv");
  const { rows, errors } = parseGamesCsv(csv);

  if (rows.length === 0 && errors.length === 0) {
    redirect(withMessage("/admin/jogos", "erro", "Cole ao menos uma linha para importar."));
  }

  if (errors.length > 0) {
    redirect(withMessage("/admin/jogos", "erro", errors.join(" ")));
  }

  const result = await importGameRows(rows);

  revalidatePath("/admin/jogos");
  redirect(withMessage("/admin/jogos", "ok", `Importacao concluida. Criados: ${result.created}. Atualizados: ${result.updated}.`));
}

export async function importDefaultGames() {
  await requireAdmin();
  const filePath = join(process.cwd(), "prisma", "data", "world-cup-2026-games.csv");
  const csv = await readFile(filePath, "utf8");
  const { rows, errors } = parseGamesCsv(csv);

  if (rows.length === 0 && errors.length === 0) {
    redirect(withMessage("/admin/jogos", "erro", "A tabela padrao ainda esta vazia. Preencha prisma/data/world-cup-2026-games.csv."));
  }

  if (errors.length > 0) {
    redirect(withMessage("/admin/jogos", "erro", errors.join(" ")));
  }

  const result = await importGameRows(rows);
  revalidatePath("/admin/jogos");
  redirect(withMessage("/admin/jogos", "ok", `Tabela padrao importada. Criados: ${result.created}. Atualizados: ${result.updated}.`));
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
  if (new Date() >= game.startsAt) {
    redirect(withMessage(participantPath, "erro", "Palpites encerrados para este jogo."));
  }

  const predictedGoalScorer = optionalText(formData, "predictedGoalScorer");
  if (hasMultipleGoalScorers(predictedGoalScorer)) {
    redirect(withMessage(participantPath, "erro", "Escolha apenas 1 jogador para marcar gol neste jogo."));
  }

  const points = calculateGamePredictionPoints({
    predictedHomeScore: int(formData, "predictedHomeScore"),
    predictedAwayScore: int(formData, "predictedAwayScore"),
    predictedGoalScorer,
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
      predictedGoalScorer,
      ...points
    },
    update: {
      predictedHomeScore: int(formData, "predictedHomeScore"),
      predictedAwayScore: int(formData, "predictedAwayScore"),
      predictedGoalScorer,
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

export async function joinDispute(formData: FormData) {
  const token = text(formData, "token");
  const disputeId = text(formData, "disputeId");
  const participantPath = `/participante/${token}`;

  const [participant, dispute] = await Promise.all([
    prisma.participant.findUnique({ where: { accessToken: token }, select: { id: true } }),
    prisma.dispute.findUnique({ where: { id: disputeId }, select: { id: true, isActive: true } })
  ]);

  if (!participant) redirect(withMessage("/", "erro", "Participante nao encontrado."));
  if (!dispute?.isActive) {
    redirect(withMessage(participantPath, "erro", "Esta disputa não está disponível no momento."));
  }

  const existing = await prisma.participantDispute.findUnique({
    where: {
      participantId_disputeId: {
        participantId: participant.id,
        disputeId: dispute.id
      }
    }
  });

  if (existing) {
    redirect(withMessage(participantPath, "ok", "Você já participa desta disputa."));
  }

  await prisma.participantDispute.upsert({
    where: {
      participantId_disputeId: {
        participantId: participant.id,
        disputeId: dispute.id
      }
    },
    create: {
      participantId: participant.id,
      disputeId: dispute.id,
      paymentStatus: "PENDING",
      paidAt: null
    },
    update: {}
  });

  revalidatePath(participantPath);
  revalidatePath("/admin/disputas");
  redirect(withMessage(participantPath, "ok", "Você entrou nesta disputa. Aguarde a confirmação do pagamento pelo administrador."));
}

async function updateParticipantDisputePayment(participantDisputeId: string, paid: boolean) {
  await requireAdmin();

  const participantDispute = await prisma.participantDispute.findUnique({
    where: { id: participantDisputeId },
    include: { participant: { select: { accessToken: true } } }
  });

  if (!participantDispute) {
    redirect(withMessage("/admin/disputas", "erro", "Vinculo da disputa nao encontrado."));
  }

  await prisma.participantDispute.update({
    where: { id: participantDispute.id },
    data: {
      paymentStatus: paid ? "PAID" : "PENDING",
      paidAt: paid ? new Date() : null
    }
  });

  revalidatePath("/admin/disputas");
  revalidatePath("/admin/ranking");
  revalidatePath(`/participante/${participantDispute.participant.accessToken}`);
}

export async function confirmParticipantDisputePayment(formData: FormData) {
  await updateParticipantDisputePayment(text(formData, "participantDisputeId"), true);
  redirect(withMessage("/admin/disputas", "ok", "Pagamento da disputa confirmado."));
}

export async function markParticipantDisputePending(formData: FormData) {
  await updateParticipantDisputePayment(text(formData, "participantDisputeId"), false);
  redirect(withMessage("/admin/disputas", "ok", "Pagamento da disputa marcado como pendente."));
}

function revalidateDisputeAdminViews() {
  revalidatePath("/admin/disputas");
  revalidatePath("/admin/ranking");
  revalidatePath("/ranking");
}

export async function removePendingParticipantFromDispute(formData: FormData) {
  await requireAdmin();
  const participantDisputeId = text(formData, "participantDisputeId");

  const participantDispute = await prisma.participantDispute.findUnique({
    where: { id: participantDisputeId },
    select: {
      id: true,
      paymentStatus: true,
      participant: { select: { accessToken: true } }
    }
  });

  if (!participantDispute) {
    revalidateDisputeAdminViews();
    redirect(withMessage("/admin/disputas", "ok", "Participante removido desta disputa."));
  }

  if (participantDispute.paymentStatus !== "PENDING") {
    redirect(withMessage("/admin/disputas", "erro", "Nao e possivel remover vinculo pago desta disputa."));
  }

  await prisma.participantDispute.deleteMany({
    where: {
      id: participantDispute.id,
      paymentStatus: "PENDING"
    }
  });

  revalidateDisputeAdminViews();
  revalidatePath(`/participante/${participantDispute.participant.accessToken}`);
  redirect(withMessage("/admin/disputas", "ok", "Participante removido desta disputa."));
}

export async function removeAllPendingParticipantsFromDispute(formData: FormData) {
  await requireAdmin();
  const disputeId = text(formData, "disputeId");

  await prisma.participantDispute.deleteMany({
    where: {
      disputeId,
      paymentStatus: "PENDING"
    }
  });

  revalidateDisputeAdminViews();
  redirect(withMessage("/admin/disputas", "ok", "Participantes pendentes removidos desta disputa."));
}

function prizePercent(formData: FormData, key: string) {
  const rawValue = text(formData, key);
  if (!/^-?\d+$/.test(rawValue)) {
    redirect(withMessage("/admin/disputas", "erro", "Todos os percentuais devem ser numeros inteiros."));
  }
  const value = Number(rawValue);
  if (!Number.isInteger(value)) {
    redirect(withMessage("/admin/disputas", "erro", "Todos os percentuais devem ser numeros inteiros."));
  }
  return value;
}

export async function updateDisputePrizePercentages(formData: FormData) {
  await requireAdmin();

  const disputeId = text(formData, "disputeId");
  const percentages = {
    organizerPrizePercent: prizePercent(formData, "organizerPrizePercent"),
    firstPrizePercent: prizePercent(formData, "firstPrizePercent"),
    secondPrizePercent: prizePercent(formData, "secondPrizePercent"),
    thirdPrizePercent: prizePercent(formData, "thirdPrizePercent")
  };
  const values = Object.values(percentages);

  if (values.some((value) => value < 0)) {
    redirect(withMessage("/admin/disputas", "erro", "Nenhum percentual pode ser negativo."));
  }

  const sum = values.reduce((total, value) => total + value, 0);
  if (sum !== 100) {
    redirect(withMessage("/admin/disputas", "erro", "A soma dos percentuais precisa ser 100%."));
  }

  await prisma.dispute.update({
    where: { id: disputeId },
    data: percentages
  });

  revalidatePath("/admin/disputas");
  revalidatePath("/admin/ranking");
  revalidatePath("/ranking");
  redirect(withMessage("/admin/disputas", "ok", "Percentuais de premiacao atualizados."));
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
