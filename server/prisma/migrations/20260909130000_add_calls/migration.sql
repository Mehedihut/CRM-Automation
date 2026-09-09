-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM (
  'CONTACTED',
  'INTERESTED',
  'NOT_INTERESTED',
  'UNREACHABLE',
  'CONVERTED',
  'FOLLOW_UP_SCHEDULED'
);

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM (
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'NOT_INTERESTED',
  'UNREACHABLE',
  'CONVERTED'
);

-- AlterTable: convert Lead.status from String to LeadStatus enum.
-- Existing rows are assumed to be "NEW" (the only value used pre-PR2);
-- any other value will fail the ALTER TYPE and must be fixed manually.
ALTER TABLE "Lead"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "LeadStatus" USING ("status"::"LeadStatus"),
  ALTER COLUMN "status" SET DEFAULT 'NEW';

-- CreateTable
CREATE TABLE "Call" (
  "id" SERIAL NOT NULL,
  "leadId" INTEGER NOT NULL,
  "agentId" INTEGER NOT NULL,
  "outcome" "CallOutcome" NOT NULL,
  "notes" TEXT,
  "duration" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Call_leadId_idx" ON "Call"("leadId");
CREATE INDEX "Call_agentId_idx" ON "Call"("agentId");
CREATE INDEX "Call_createdAt_idx" ON "Call"("createdAt");

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Call" ADD CONSTRAINT "Call_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
