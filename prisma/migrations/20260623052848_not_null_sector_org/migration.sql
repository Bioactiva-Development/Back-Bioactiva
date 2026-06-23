/*
  Warnings:

  - Made the column `sector` on table `Organizacion` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Organizacion" ALTER COLUMN "sector" SET NOT NULL;
