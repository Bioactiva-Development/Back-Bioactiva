-- AlterTable
-- "dirigido" pasa a derivarse del contacto del lead al crear la cotización: si
-- el lead no tiene contacto asociado queda en NULL en vez de exigirse en el
-- endpoint de creación.
ALTER TABLE "Cotizacion" ALTER COLUMN "dirigido" DROP NOT NULL;
