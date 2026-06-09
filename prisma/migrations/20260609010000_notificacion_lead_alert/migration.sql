-- DropForeignKey
ALTER TABLE "Notificacion" DROP CONSTRAINT "Notificacion_idActividad_fkey";

-- AlterTable: la notificación in-app puede referir a un lead; la actividad pasa a ser opcional
ALTER TABLE "Notificacion" ALTER COLUMN "idActividad" DROP NOT NULL;
ALTER TABLE "Notificacion" ADD COLUMN "idLead" INTEGER;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_idActividad_fkey" FOREIGN KEY ("idActividad") REFERENCES "Actividad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_idLead_fkey" FOREIGN KEY ("idLead") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
