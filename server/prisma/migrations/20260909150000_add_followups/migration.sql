-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'DONE', 'MISSED', 'CANCELED');

-- CreateTable
CREATE TABLE "FollowUp" (
  "id" SERIAL NOT NULL,
  "leadId" INTEGER NOT NULL,
  "assigneeId" INTEGER NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FollowUp_leadId_idx" ON "FollowUp"("leadId");
CREATE INDEX "FollowUp_assigneeId_idx" ON "FollowUp"("assigneeId");
CREATE INDEX "FollowUp_scheduledAt_idx" ON "FollowUp"("scheduledAt");
CREATE INDEX "FollowUp_status_idx" ON "FollowUp"("status");

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
