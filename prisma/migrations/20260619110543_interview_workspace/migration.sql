-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "aiBrief" TEXT,
ADD COLUMN     "aiBriefAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "stage" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "currentStage" TEXT;
