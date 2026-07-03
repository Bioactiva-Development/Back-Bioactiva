/*
  Warnings:

  - You are about to drop the `PasoSeguimiento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RecordatorioActividad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SecuenciaSeguimiento` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PasoSeguimiento" DROP CONSTRAINT "PasoSeguimiento_idSecuencia_fkey";

-- DropForeignKey
ALTER TABLE "PasoSeguimiento" DROP CONSTRAINT "PasoSeguimiento_idTemplate_fkey";

-- DropForeignKey
ALTER TABLE "RecordatorioActividad" DROP CONSTRAINT "RecordatorioActividad_idActividad_fkey";

-- DropForeignKey
ALTER TABLE "SecuenciaSeguimiento" DROP CONSTRAINT "SecuenciaSeguimiento_idActividad_fkey";

-- DropTable
DROP TABLE "PasoSeguimiento";

-- DropTable
DROP TABLE "RecordatorioActividad";

-- DropTable
DROP TABLE "SecuenciaSeguimiento";

-- DropEnum
DROP TYPE "EstadoPaso";

-- DropEnum
DROP TYPE "EstadoSecuencia";
