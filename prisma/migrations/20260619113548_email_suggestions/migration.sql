-- CreateTable
CREATE TABLE "EmailSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "classification" TEXT NOT NULL,
    "proposedStatus" TEXT NOT NULL,
    "fromEmail" TEXT,
    "subject" TEXT,
    "snippet" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailSuggestion_userId_status_idx" ON "EmailSuggestion"("userId", "status");

-- AddForeignKey
ALTER TABLE "EmailSuggestion" ADD CONSTRAINT "EmailSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
