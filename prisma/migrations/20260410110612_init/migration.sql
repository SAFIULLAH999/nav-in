-- AlterTable
ALTER TABLE "ProfileMedia" ADD COLUMN "sourceId" TEXT;
ALTER TABLE "ProfileMedia" ADD COLUMN "sourceType" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "currentOpenToType" TEXT;
ALTER TABLE "User" ADD COLUMN "githubToken" TEXT;
ALTER TABLE "User" ADD COLUMN "githubUsername" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuizAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL,
    "earnedPoints" INTEGER NOT NULL,
    "answers" TEXT NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "badgeEarnedId" TEXT,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuizAttempt_badgeEarnedId_fkey" FOREIGN KEY ("badgeEarnedId") REFERENCES "VerificationBadge" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_QuizAttempt" ("answers", "completedAt", "createdAt", "earnedPoints", "id", "passed", "quizId", "score", "timeSpent", "totalPoints", "userId") SELECT "answers", "completedAt", "createdAt", "earnedPoints", "id", "passed", "quizId", "score", "timeSpent", "totalPoints", "userId" FROM "QuizAttempt";
DROP TABLE "QuizAttempt";
ALTER TABLE "new_QuizAttempt" RENAME TO "QuizAttempt";
CREATE UNIQUE INDEX "QuizAttempt_userId_quizId_key" ON "QuizAttempt"("userId", "quizId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ProfileMedia_userId_sourceType_idx" ON "ProfileMedia"("userId", "sourceType");
