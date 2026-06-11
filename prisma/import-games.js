const { randomUUID } = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { Client } = require("pg");

const CSV_PATH = path.join(__dirname, "data", "world-cup-2026-games.csv");
const HEADER = "numero;fase;grupo;timeCasa;timeVisitante;dataHora";

async function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");

  try {
    const content = await fs.readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator);
      const value = trimmed.slice(separator + 1).replace(/^"|"$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Environment variables may already be provided by the shell or hosting platform.
  }
}

function parseGamesCsv(content) {
  const errors = [];
  const rows = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;
    if (index === 0 && line.toLowerCase() === HEADER.toLowerCase()) return;

    const columns = line.split(";");
    const [number, stage, groupName, homeTeam, awayTeam, startsAt] = columns;
    const parsedNumber = Number(number);
    const parsedDate = new Date(startsAt || "");

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

async function importGames(client, rows) {
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const existingResult = await client.query(
      'SELECT "homeScore", "awayScore", "status" FROM "Game" WHERE "number" = $1',
      [row.number]
    );
    const existing = existingResult.rows[0];

    if (!existing) {
      await client.query(
        `INSERT INTO "Game"
          ("id", "number", "stage", "groupName", "homeTeam", "awayTeam", "startsAt", "status", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'AGENDADO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          randomUUID(),
          row.number,
          row.stage,
          row.groupName,
          row.homeTeam,
          row.awayTeam,
          row.startsAt
        ]
      );
      created += 1;
      continue;
    }

    const hasResult = existing.homeScore !== null || existing.awayScore !== null;

    await client.query(
      `UPDATE "Game"
       SET "stage" = $1,
           "groupName" = $2,
           "homeTeam" = $3,
           "awayTeam" = $4,
           "startsAt" = $5,
           "status" = $6,
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE "number" = $7`,
      [
        row.stage,
        row.groupName,
        row.homeTeam,
        row.awayTeam,
        row.startsAt,
        hasResult ? existing.status : "AGENDADO",
        row.number
      ]
    );
    updated += 1;
  }

  return { created, updated };
}

async function main() {
  await loadEnv();

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Configure DATABASE_URL ou DIRECT_URL antes de importar os jogos.");
  }

  const content = await fs.readFile(CSV_PATH, "utf8");
  const { rows, errors } = parseGamesCsv(content);

  if (errors.length > 0) {
    console.error("Erros encontrados no CSV:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    const result = await importGames(client, rows);
    console.log(`Importacao concluida. Criados: ${result.created}. Atualizados: ${result.updated}.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
