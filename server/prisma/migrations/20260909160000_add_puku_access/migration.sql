-- CreateEnum
CREATE TYPE "PukuRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PukuAccessRequest" (
  "id" SERIAL NOT NULL,
  "requesterName" TEXT NOT NULL,
  "requesterEmail" TEXT,
  "requesterPhone" TEXT,
  "requestedScope" TEXT NOT NULL,
  "reason" TEXT,
  "status" "PukuRequestStatus" NOT NULL DEFAULT 'PENDING',
  "decidedById" INTEGER,
  "decidedAt" TIMESTAMP(3),
  "decisionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PukuAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PukuAccessRequest_status_idx" ON "PukuAccessRequest"("status");
CREATE INDEX "PukuAccessRequest_createdAt_idx" ON "PukuAccessRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "PukuAccessRequest" ADD CONSTRAINT "PukuAccessRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
