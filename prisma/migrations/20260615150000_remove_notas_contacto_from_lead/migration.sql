-- AlterTable
-- "Historial de contacto" deja de ser un campo del Lead: en el export se deriva
-- de las actividades del lead y en el import ya no se mapea.
ALTER TABLE "Lead" DROP COLUMN "notasContacto";
