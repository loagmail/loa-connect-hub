/*
  Warnings:

  - Added the required column `startDate` to the `FacultyAvailabilityRule` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FacultyAvailabilityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facultyId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    CONSTRAINT "FacultyAvailabilityRule_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FacultyAvailabilityRule" ("dayOfWeek", "endTime", "facultyId", "id", "isBlocked", "startTime") SELECT "dayOfWeek", "endTime", "facultyId", "id", "isBlocked", "startTime" FROM "FacultyAvailabilityRule";
DROP TABLE "FacultyAvailabilityRule";
ALTER TABLE "new_FacultyAvailabilityRule" RENAME TO "FacultyAvailabilityRule";
CREATE UNIQUE INDEX "FacultyAvailabilityRule_facultyId_dayOfWeek_startDate_key" ON "FacultyAvailabilityRule"("facultyId", "dayOfWeek", "startDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
