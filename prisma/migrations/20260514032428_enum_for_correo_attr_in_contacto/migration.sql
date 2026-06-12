-- CreateEnum
CREATE TYPE "EstadoCorreo" AS ENUM ('VIGENTE', 'VENCIDO');

-- AlterTable
ALTER TABLE "Contacto" ADD COLUMN     "estado_correo" "EstadoCorreo" NOT NULL DEFAULT 'VIGENTE';
