-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AGENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT NOT NULL DEFAULT '__placeholder__',
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'AGENT';

-- Remove the placeholder default now that existing rows have a value. New
-- rows going forward will be created via the API/admin script with a real
-- passwordHash. The DEFAULT '__placeholder__' would let NULLs slip in if
-- the column were ever made nullable; we drop it defensively.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP DEFAULT;

-- NOTE: existing rows still have passwordHash = '__placeholder__'. They
-- cannot log in until an admin resets their password via `npm run admin:create`
-- or by directly updating the DB. This is intentional: any data created
-- before auth existed should be re-bootstrapped.
