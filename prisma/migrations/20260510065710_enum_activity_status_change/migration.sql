/*
  Warnings:

  - The values [REPROGRAMADA] on the enum `EstadoActividad` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoActividad_new" AS ENUM ('PENDIENTE', 'REALIZADA', 'CANCELADA');
ALTER TABLE "public"."Actividad" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Actividad" ALTER COLUMN "estado" TYPE "EstadoActividad_new" USING ("estado"::text::"EstadoActividad_new");
ALTER TYPE "EstadoActividad" RENAME TO "EstadoActividad_old";
ALTER TYPE "EstadoActividad_new" RENAME TO "EstadoActividad";
DROP TYPE "public"."EstadoActividad_old";
ALTER TABLE "Actividad" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';
COMMIT;
