-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('AGENDADO', 'AO_VIVO', 'ENCERRADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "groupName" TEXT,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'AGENDADO',
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "predictedHomeScore" INTEGER NOT NULL,
    "predictedAwayScore" INTEGER NOT NULL,
    "predictedGoalScorer" TEXT,
    "scorePoints" INTEGER NOT NULL DEFAULT 0,
    "resultPoints" INTEGER NOT NULL DEFAULT 0,
    "goalScorerPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalScorer" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "teamName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalScorer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialPrediction" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "championTeam" TEXT NOT NULL,
    "topScorerPlayer" TEXT NOT NULL,
    "championPoints" INTEGER NOT NULL DEFAULT 0,
    "topScorerPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "poolName" TEXT NOT NULL DEFAULT 'Bolão da Copa dos Amigos',
    "entryFee" DECIMAL(65,30) NOT NULL DEFAULT 50,
    "pixKey" TEXT NOT NULL DEFAULT '',
    "pixReceiverName" TEXT NOT NULL DEFAULT '',
    "organizerWhatsapp" TEXT NOT NULL DEFAULT '',
    "organizerPercentage" DECIMAL(65,30) NOT NULL DEFAULT 20,
    "firstPlacePercentage" DECIMAL(65,30) NOT NULL DEFAULT 40,
    "secondPlacePercentage" DECIMAL(65,30) NOT NULL DEFAULT 25,
    "thirdPlacePercentage" DECIMAL(65,30) NOT NULL DEFAULT 15,
    "specialPredictionsLocked" BOOLEAN NOT NULL DEFAULT false,
    "officialChampion" TEXT,
    "officialTopScorers" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_accessToken_key" ON "Participant"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "Game_number_key" ON "Game"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_participantId_gameId_key" ON "Prediction"("participantId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialPrediction_participantId_key" ON "SpecialPrediction"("participantId");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalScorer" ADD CONSTRAINT "GoalScorer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialPrediction" ADD CONSTRAINT "SpecialPrediction_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
