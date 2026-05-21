/*
  Warnings:

  - You are about to drop the `FacultySchedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `scheduleId` on the `Appointment` table. All the data in the column will be lost.
  - Added the required column `date` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FacultySchedule";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "teamsLink" TEXT,
    "teamsSyncStatus" TEXT NOT NULL DEFAULT 'UNWRITTEN',
    "teamsSyncRetries" INTEGER NOT NULL DEFAULT 0,
    "teamsSyncError" TEXT,
    "teamsSyncLastAttempt" DATETIME,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("description", "facultyId", "id", "requestedAt", "status", "studentId", "teamsLink", "teamsSyncError", "teamsSyncLastAttempt", "teamsSyncRetries", "teamsSyncStatus", "title", "updatedAt") SELECT "description", "facultyId", "id", "requestedAt", "status", "studentId", "teamsLink", "teamsSyncError", "teamsSyncLastAttempt", "teamsSyncRetries", "teamsSyncStatus", "title", "updatedAt" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
