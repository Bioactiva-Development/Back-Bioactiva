/*
  Warnings:

  - A unique constraint covering the columns `[ruc]` on the table `Organizacion` will be added. If there are existing duplicate values, this will fail.

  Antes de aplicar, verificar duplicados existentes (los NULL no cuentan):

    SELECT "ruc", COUNT(*) FROM "Organizacion"
    WHERE "ruc" IS NOT NULL
    GROUP BY "ruc" HAVING COUNT(*) > 1;

*/
-- CreateIndex
CREATE UNIQUE INDEX "Organizacion_ruc_key" ON "Organizacion"("ruc");
