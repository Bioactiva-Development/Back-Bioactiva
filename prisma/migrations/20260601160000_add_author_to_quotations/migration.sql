-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN "idAuthor" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_idAuthor_fkey" FOREIGN KEY ("idAuthor") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
