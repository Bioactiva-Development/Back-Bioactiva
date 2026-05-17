/*
  Warnings:

  - A unique constraint covering the columns `[correo2]` on the table `Contacto` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `TemplateEmail` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Contacto_correo2_key" ON "Contacto"("correo2");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateEmail_nombre_key" ON "TemplateEmail"("nombre");
