-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('RECORDATORIO', 'SEGUIMIENTO');

-- CreateEnum
CREATE TYPE "EstadoNotificacionProgramada" AS ENUM ('PROGRAMADA', 'VENCIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "NotificacionProgramada" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "estado" "EstadoNotificacionProgramada" NOT NULL DEFAULT 'PROGRAMADA',
    "idActividad" INTEGER NOT NULL,
    "idLead" INTEGER NOT NULL,
    "idResponsable" INTEGER NOT NULL,
    "asuntoInterno" VARCHAR(255) NOT NULL,
    "cuerpoInterno" TEXT NOT NULL,
    "fechaEnvioInterno" TIMESTAMP(3) NOT NULL,
    "idTemplateInterno" INTEGER,
    "jobIdInterno" VARCHAR(150),
    "enviadoInterno" BOOLEAN NOT NULL DEFAULT false,
    "correoCliente" VARCHAR(254),
    "asuntoExterno" VARCHAR(255),
    "cuerpoExterno" TEXT,
    "fechaEnvioExterno" TIMESTAMP(3),
    "idTemplateExterno" INTEGER,
    "jobIdExterno" VARCHAR(150),
    "enviadoExterno" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificacionProgramada_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NotificacionProgramada" ADD CONSTRAINT "NotificacionProgramada_idActividad_fkey" FOREIGN KEY ("idActividad") REFERENCES "Actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionProgramada" ADD CONSTRAINT "NotificacionProgramada_idLead_fkey" FOREIGN KEY ("idLead") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionProgramada" ADD CONSTRAINT "NotificacionProgramada_idResponsable_fkey" FOREIGN KEY ("idResponsable") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
