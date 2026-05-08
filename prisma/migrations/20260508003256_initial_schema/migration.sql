-- CreateEnum
CREATE TYPE "Tamano" AS ENUM ('GRANDE', 'MEDIANO', 'PEQUENO', 'MICRO');

-- CreateEnum
CREATE TYPE "Sector" AS ENUM ('ACUICULTURA', 'ADMINISTRACION_PUBLICA', 'AGRICOLA', 'AGROALIMENTARIA', 'AGROPECUARIO', 'ALIMENTARIA', 'ASESORIA', 'BANCA_Y_SEGUROS', 'CONSTRUCCION', 'CONSULTORIA', 'COOPERACION_TECNICA', 'EDUCACION', 'ENERGIA', 'FERRETERIA', 'FINANZAS', 'FORESTAL', 'GANADERIA', 'INFORMATICA', 'MANUFACTURA', 'MINERIA', 'OTROS', 'PESCA', 'SALUD', 'TECNOLOGIA', 'TEXTIL', 'TRANSFORMACION', 'TURISMO');

-- CreateEnum
CREATE TYPE "TipoEmpresa" AS ENUM ('ACADEMIA', 'EMPRESA_INTERNACIONAL', 'EMPRESA_NACIONAL', 'GOBIERNO_NACIONAL', 'INDEPENDIENTE', 'ONG', 'ORGANISMO_INTERNACIONAL');

-- CreateEnum
CREATE TYPE "Vocativo" AS ENUM ('SR', 'SRA', 'SRTA');

-- CreateEnum
CREATE TYPE "LeadState" AS ENUM ('EN_PROSPECTO', 'OFERTADO', 'CIERRE_CON_VENTA', 'CIERRE_SIN_VENTA');

-- CreateEnum
CREATE TYPE "TipoActividad" AS ENUM ('REUNION', 'LLAMADA', 'EMAIL', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoActividad" AS ENUM ('PENDIENTE', 'REALIZADA', 'CANCELADA', 'REPROGRAMADA');

-- CreateEnum
CREATE TYPE "EstadoSecuencia" AS ENUM ('PROGRAMADA', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoPaso" AS ENUM ('PENDIENTE', 'ENVIADO', 'CANCELADO', 'FALLIDO');

-- CreateEnum
CREATE TYPE "TipoMoneda" AS ENUM ('PEN', 'USD');

-- CreateEnum
CREATE TYPE "EstadoCot" AS ENUM ('ENVIADA', 'ACEPTADA', 'RECHAZADA', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRADOR', 'TRABAJADOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDIENTE', 'ACTIVO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "TokenPurpose" AS ENUM ('INVITACION', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('PENDIENTE', 'CONSUMIDO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('NO_LEIDA', 'LEIDA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombres" VARCHAR(90) NOT NULL,
    "apellidos" VARCHAR(90) NOT NULL,
    "rol" "Role" NOT NULL DEFAULT 'TRABAJADOR',
    "estado" "UserStatus" NOT NULL DEFAULT 'PENDIENTE',
    "correo" VARCHAR(254) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organizacion" (
    "id" UUID NOT NULL,
    "codigoCliente" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "nombreComercial" VARCHAR(100) NOT NULL,
    "subArea" VARCHAR(60),
    "ruc" VARCHAR(11),
    "tipo" "TipoEmpresa" NOT NULL,
    "linkedin" VARCHAR(255),
    "ubicacion" VARCHAR(100),
    "sector" "Sector",
    "tamano" "Tamano" NOT NULL,
    "actividadEconomica" VARCHAR(120),
    "alianzasEstrategicas" VARCHAR(300),
    "idContactoActivo" INTEGER,
    "idAuthor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contacto" (
    "id" SERIAL NOT NULL,
    "nombres" VARCHAR(90) NOT NULL,
    "apellidos" VARCHAR(90),
    "vocativo" "Vocativo",
    "cargo" VARCHAR(120),
    "correo" VARCHAR(254) NOT NULL,
    "telefono" VARCHAR(20),
    "correo2" VARCHAR(254),
    "comentarios" VARCHAR(500),
    "idOrganizacion" UUID NOT NULL,
    "idAuthor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "estado" "LeadState" NOT NULL,
    "servicioInteres" VARCHAR(120) NOT NULL,
    "comentarios" VARCHAR(500),
    "desafioOportunidad" VARCHAR(500),
    "notasContacto" VARCHAR(1000),
    "canalCaptacion" VARCHAR(60),
    "idOrg" UUID NOT NULL,
    "idContacto" INTEGER,
    "idEncargado" INTEGER NOT NULL,
    "idAuthor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actividad" (
    "id" SERIAL NOT NULL,
    "nombreActividad" VARCHAR(90) NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoActividad" NOT NULL,
    "estado" "EstadoActividad" NOT NULL DEFAULT 'PENDIENTE',
    "notas" VARCHAR(1000),
    "outlookEventId" VARCHAR(255),
    "outlookImported" BOOLEAN NOT NULL DEFAULT false,
    "teamsMeetingUrl" TEXT,
    "seguimientoAutomatico" BOOLEAN NOT NULL DEFAULT false,
    "idLead" INTEGER NOT NULL,
    "idResponsable" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecuenciaSeguimiento" (
    "id" SERIAL NOT NULL,
    "idActividad" INTEGER NOT NULL,
    "estado" "EstadoSecuencia" NOT NULL DEFAULT 'PROGRAMADA',
    "fechaActivacion" TIMESTAMP(3),
    "fechaFinalizacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecuenciaSeguimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasoSeguimiento" (
    "id" SERIAL NOT NULL,
    "orden" INTEGER NOT NULL,
    "esperarDias" INTEGER NOT NULL,
    "jobId" VARCHAR(120),
    "fechaProgramada" TIMESTAMP(3),
    "fechaEnviado" TIMESTAMP(3),
    "estado" "EstadoPaso" NOT NULL DEFAULT 'PENDIENTE',
    "idSecuencia" INTEGER NOT NULL,
    "idTemplate" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasoSeguimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateEmail" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "asunto" VARCHAR(255) NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordatorioActividad" (
    "id" SERIAL NOT NULL,
    "minutosAntes" INTEGER NOT NULL,
    "enviado" BOOLEAN NOT NULL DEFAULT false,
    "jobId" VARCHAR(120),
    "idActividad" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordatorioActividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" SERIAL NOT NULL,
    "fechaCot" TIMESTAMP(3) NOT NULL,
    "dirigido" VARCHAR(90) NOT NULL,
    "cliente" VARCHAR(120) NOT NULL,
    "producto" VARCHAR(120),
    "nombreRemitente" VARCHAR(120) NOT NULL,
    "nombreServicio" VARCHAR(150) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "tipo" "TipoMoneda" NOT NULL,
    "estado" "EstadoCot" NOT NULL,
    "observacion" VARCHAR(1000),
    "linkPropuesta" VARCHAR(500),
    "idLead" INTEGER NOT NULL,
    "idRemitente" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegracionMicrosoft" (
    "id" SERIAL NOT NULL,
    "idUsuario" INTEGER NOT NULL,
    "microsoftEmail" VARCHAR(254) NOT NULL,
    "microsoftOid" VARCHAR(255) NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "conectado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegracionMicrosoft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserToken" (
    "id" SERIAL NOT NULL,
    "correo" VARCHAR(254) NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "proposito" "TokenPurpose" NOT NULL,
    "estado" "TokenStatus" NOT NULL DEFAULT 'PENDIENTE',
    "rol" "Role",
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "idUsuario" INTEGER,
    "invitadorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(120) NOT NULL,
    "mensaje" VARCHAR(300) NOT NULL,
    "estado" "EstadoNotificacion" NOT NULL DEFAULT 'NO_LEIDA',
    "idUsuario" INTEGER NOT NULL,
    "idActividad" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Organizacion_codigoCliente_key" ON "Organizacion"("codigoCliente");

-- CreateIndex
CREATE UNIQUE INDEX "Organizacion_nombre_key" ON "Organizacion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Contacto_correo_key" ON "Contacto"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "SecuenciaSeguimiento_idActividad_key" ON "SecuenciaSeguimiento"("idActividad");

-- CreateIndex
CREATE UNIQUE INDEX "IntegracionMicrosoft_idUsuario_key" ON "IntegracionMicrosoft"("idUsuario");

-- CreateIndex
CREATE UNIQUE INDEX "IntegracionMicrosoft_microsoftEmail_key" ON "IntegracionMicrosoft"("microsoftEmail");

-- CreateIndex
CREATE UNIQUE INDEX "IntegracionMicrosoft_microsoftOid_key" ON "IntegracionMicrosoft"("microsoftOid");

-- CreateIndex
CREATE UNIQUE INDEX "UserToken_tokenHash_key" ON "UserToken"("tokenHash");

-- AddForeignKey
ALTER TABLE "Organizacion" ADD CONSTRAINT "Organizacion_idContactoActivo_fkey" FOREIGN KEY ("idContactoActivo") REFERENCES "Contacto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organizacion" ADD CONSTRAINT "Organizacion_idAuthor_fkey" FOREIGN KEY ("idAuthor") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contacto" ADD CONSTRAINT "Contacto_idOrganizacion_fkey" FOREIGN KEY ("idOrganizacion") REFERENCES "Organizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contacto" ADD CONSTRAINT "Contacto_idAuthor_fkey" FOREIGN KEY ("idAuthor") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_idOrg_fkey" FOREIGN KEY ("idOrg") REFERENCES "Organizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_idContacto_fkey" FOREIGN KEY ("idContacto") REFERENCES "Contacto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_idEncargado_fkey" FOREIGN KEY ("idEncargado") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_idAuthor_fkey" FOREIGN KEY ("idAuthor") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_idLead_fkey" FOREIGN KEY ("idLead") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_idResponsable_fkey" FOREIGN KEY ("idResponsable") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecuenciaSeguimiento" ADD CONSTRAINT "SecuenciaSeguimiento_idActividad_fkey" FOREIGN KEY ("idActividad") REFERENCES "Actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasoSeguimiento" ADD CONSTRAINT "PasoSeguimiento_idSecuencia_fkey" FOREIGN KEY ("idSecuencia") REFERENCES "SecuenciaSeguimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasoSeguimiento" ADD CONSTRAINT "PasoSeguimiento_idTemplate_fkey" FOREIGN KEY ("idTemplate") REFERENCES "TemplateEmail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordatorioActividad" ADD CONSTRAINT "RecordatorioActividad_idActividad_fkey" FOREIGN KEY ("idActividad") REFERENCES "Actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_idLead_fkey" FOREIGN KEY ("idLead") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_idRemitente_fkey" FOREIGN KEY ("idRemitente") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegracionMicrosoft" ADD CONSTRAINT "IntegracionMicrosoft_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_invitadorId_fkey" FOREIGN KEY ("invitadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_idActividad_fkey" FOREIGN KEY ("idActividad") REFERENCES "Actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
