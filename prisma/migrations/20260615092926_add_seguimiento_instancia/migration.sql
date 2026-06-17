/*
  Warnings:

  - You are about to drop the column `asuntoExterno` on the `NotificacionProgramada` table. All the data in the column will be lost.
  - You are about to drop the column `cuerpoExterno` on the `NotificacionProgramada` table. All the data in the column will be lost.
  - You are about to drop the column `enviadoExterno` on the `NotificacionProgramada` table. All the data in the column will be lost.
  - You are about to drop the column `fechaEnvioExterno` on the `NotificacionProgramada` table. All the data in the column will be lost.
  - You are about to drop the column `idTemplateExterno` on the `NotificacionProgramada` table. All the data in the column will be lost.
  - You are about to drop the column `jobIdExterno` on the `NotificacionProgramada` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NotificacionProgramada" DROP COLUMN "asuntoExterno",
DROP COLUMN "cuerpoExterno",
DROP COLUMN "enviadoExterno",
DROP COLUMN "fechaEnvioExterno",
DROP COLUMN "idTemplateExterno",
DROP COLUMN "jobIdExterno",
ALTER COLUMN "asuntoInterno" DROP NOT NULL,
ALTER COLUMN "cuerpoInterno" DROP NOT NULL,
ALTER COLUMN "fechaEnvioInterno" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SeguimientoInstancia" (
    "id" SERIAL NOT NULL,
    "orden" INTEGER NOT NULL,
    "idNotificacion" INTEGER NOT NULL,
    "asuntoInterno" VARCHAR(255) NOT NULL,
    "cuerpoInterno" TEXT NOT NULL,
    "fechaEnvioInterno" TIMESTAMP(3) NOT NULL,
    "idTemplateInterno" INTEGER,
    "jobIdInterno" VARCHAR(150),
    "enviadoInterno" BOOLEAN NOT NULL DEFAULT false,
    "asuntoExterno" VARCHAR(255) NOT NULL,
    "cuerpoExterno" TEXT NOT NULL,
    "fechaEnvioExterno" TIMESTAMP(3) NOT NULL,
    "idTemplateExterno" INTEGER,
    "jobIdExterno" VARCHAR(150),
    "enviadoExterno" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeguimientoInstancia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeguimientoInstancia_idNotificacion_orden_key" ON "SeguimientoInstancia"("idNotificacion", "orden");

-- AddForeignKey
ALTER TABLE "SeguimientoInstancia" ADD CONSTRAINT "SeguimientoInstancia_idNotificacion_fkey" FOREIGN KEY ("idNotificacion") REFERENCES "NotificacionProgramada"("id") ON DELETE CASCADE ON UPDATE CASCADE;
