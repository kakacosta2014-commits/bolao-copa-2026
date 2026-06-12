-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "entryFeeCents" INTEGER NOT NULL DEFAULT 5000,
    "kind" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "includesSpecialPredictions" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeGame" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantDispute" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantDispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_slug_key" ON "Dispute"("slug");

-- CreateIndex
CREATE INDEX "DisputeGame_gameId_idx" ON "DisputeGame"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeGame_disputeId_gameId_key" ON "DisputeGame"("disputeId", "gameId");

-- CreateIndex
CREATE INDEX "ParticipantDispute_disputeId_idx" ON "ParticipantDispute"("disputeId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantDispute_participantId_disputeId_key" ON "ParticipantDispute"("participantId", "disputeId");

-- AddForeignKey
ALTER TABLE "DisputeGame" ADD CONSTRAINT "DisputeGame_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeGame" ADD CONSTRAINT "DisputeGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantDispute" ADD CONSTRAINT "ParticipantDispute_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantDispute" ADD CONSTRAINT "ParticipantDispute_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
