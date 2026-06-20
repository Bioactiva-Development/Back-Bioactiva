import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
    TipoEmpresa,
    Tamano,
    Sector,
    LeadState,
    EstadoCot,
} from '@prisma/client';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import {
    ICrmReadRepository,
    OrgExportRow,
    ContactExportRow,
    LeadExportRow,
    CotizacionExportRow,
    OrgExportFilters,
    ContactExportFilters,
    LeadExportFilters,
    CotizacionExportFilters,
} from '@/modules/data-management/domain/ports/crm-read.repository';

/** Helper para filtros de texto "contiene" sin distinguir mayúsculas. */
function contains(value: string): Prisma.StringFilter {
    return { contains: value, mode: 'insensitive' };
}

function fullName(
    nombres: string | null | undefined,
    apellidos: string | null | undefined,
): string {
    return [nombres, apellidos].filter(Boolean).join(' ').trim();
}

/**
 * "Historial de contacto" del lead: registro de sus actividades (una línea por
 * actividad, en orden cronológico). Reemplaza al antiguo campo notasContacto.
 */
function buildHistorial(
    actividades: {
        nombreActividad: string;
        fechaInicio: Date;
        estado: string;
        notas: string | null;
    }[],
): string | null {
    if (actividades.length === 0) {
        return null;
    }
    return actividades
        .map((a) => {
            const d = a.fechaInicio;
            const fecha = `${String(d.getDate()).padStart(2, '0')}/${String(
                d.getMonth() + 1,
            ).padStart(2, '0')}/${d.getFullYear()}`;
            const base = `${fecha} · ${a.nombreActividad} (${a.estado})`;
            return a.notas ? `${base}: ${a.notas}` : base;
        })
        .join('\n');
}

@Injectable()
export class PrismaCrmReadRepository implements ICrmReadRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findOrganizations(opts: {
        includeDeleted: boolean;
        filters?: OrgExportFilters;
    }): Promise<OrgExportRow[]> {
        const f = opts.filters ?? {};
        const where: Prisma.OrganizacionWhereInput = {};
        if (!opts.includeDeleted) {
            where.deletedAt = null;
        }
        if (f.nombre) {
            where.OR = [
                { nombre: contains(f.nombre) },
                { nombreComercial: contains(f.nombre) },
            ];
        }
        if (f.ruc) {
            where.ruc = contains(f.ruc);
        }
        if (f.tipo) {
            where.tipo = f.tipo as TipoEmpresa;
        }
        if (f.sector) {
            where.sector = f.sector as Sector;
        }
        if (f.tamano) {
            where.tamano = f.tamano as Tamano;
        }

        const records = await this.prisma.organizacion.findMany({
            where,
            include: {
                contactoActivo: {
                    select: { nombres: true, apellidos: true },
                },
            },
            orderBy: { nombre: 'asc' },
        });

        return records.map((r) => ({
            codigoCliente: r.codigoCliente,
            nombre: r.nombre,
            nombreComercial: r.nombreComercial,
            ruc: r.ruc,
            tipo: r.tipo,
            tamano: r.tamano,
            sector: r.sector,
            alianzasEstrategicas: r.alianzasEstrategicas,
            actividadEconomica: r.actividadEconomica,
            ubicacion: r.ubicacion,
            linkedin: r.linkedin,
            contactoActivoNombre: r.contactoActivo
                ? fullName(r.contactoActivo.nombres, r.contactoActivo.apellidos)
                : null,
            deletedAt: r.deletedAt,
        }));
    }

    async findContacts(opts?: {
        filters?: ContactExportFilters;
    }): Promise<ContactExportRow[]> {
        const f = opts?.filters ?? {};
        const where: Prisma.ContactoWhereInput = {};
        if (f.nombre) {
            where.OR = [
                { nombres: contains(f.nombre) },
                { apellidos: contains(f.nombre) },
            ];
        }
        if (f.correo) {
            where.correo = contains(f.correo);
        }
        if (f.organizacion) {
            where.organizacion = {
                OR: [
                    { nombre: contains(f.organizacion) },
                    { nombreComercial: contains(f.organizacion) },
                ],
            };
        }

        const records = await this.prisma.contacto.findMany({
            where,
            include: {
                organizacion: {
                    select: {
                        nombreComercial: true,
                        nombre: true,
                        ruc: true,
                        tamano: true,
                        tipo: true,
                        sector: true,
                        ubicacion: true,
                    },
                },
            },
            orderBy: { id: 'asc' },
        });

        return records.map((r) => ({
            id: r.id,
            vocativo: r.vocativo,
            nombres: r.nombres,
            apellidos: r.apellidos,
            correo: r.correo,
            correo2: r.correo2,
            telefono: r.telefono,
            cargo: r.cargo,
            comentarios: r.comentarios,
            estadoCorreo: r.estado_correo,
            orgNombreComercial: r.organizacion.nombreComercial,
            orgNombre: r.organizacion.nombre,
            orgRuc: r.organizacion.ruc,
            orgTamano: r.organizacion.tamano,
            orgTipo: r.organizacion.tipo,
            orgSector: r.organizacion.sector,
            orgUbicacion: r.organizacion.ubicacion,
        }));
    }

    async findLeads(opts?: {
        filters?: LeadExportFilters;
    }): Promise<LeadExportRow[]> {
        const f = opts?.filters ?? {};
        const now = new Date();
        // No exportar leads cuya organización fue eliminada (soft delete).
        const where: Prisma.LeadWhereInput = {
            deletedAt: null,
            organizacion: { deletedAt: null },
        };
        if (f.estado) {
            where.estado = f.estado as LeadState;
        }
        if (f.servicio) {
            where.servicioInteres = contains(f.servicio);
        }
        if (f.organizacion) {
            where.organizacion = {
                deletedAt: null,
                OR: [
                    { nombre: contains(f.organizacion) },
                    { nombreComercial: contains(f.organizacion) },
                ],
            };
        }

        const records = await this.prisma.lead.findMany({
            where,
            include: {
                organizacion: {
                    select: {
                        nombreComercial: true,
                        ruc: true,
                        tipo: true,
                        sector: true,
                    },
                },
                contacto: {
                    select: { nombres: true, apellidos: true, correo: true },
                },
                encargado: { select: { nombres: true, apellidos: true } },
                actividades: {
                    where: { deletedAt: null },
                    orderBy: { fechaInicio: 'asc' },
                    select: {
                        nombreActividad: true,
                        fechaInicio: true,
                        fechaFin: true,
                        estado: true,
                        notas: true,
                    },
                },
            },
            orderBy: { id: 'asc' },
        });

        return records.map((r) => {
            const pending =
                r.actividades.find((a) => a.estado === 'PENDIENTE') ?? null;
            return {
                id: r.id,
                estado: r.estado,
                servicioInteres: r.servicioInteres,
                comentarios: r.comentarios,
                desafioOportunidad: r.desafioOportunidad,
                historial: buildHistorial(r.actividades),
                canalCaptacion: r.canalCaptacion,
                createdAt: r.createdAt,
                fechaCierre: r.fechaCierre,
                orgNombreComercial: r.organizacion.nombreComercial,
                orgRuc: r.organizacion.ruc,
                orgTipo: r.organizacion.tipo,
                orgSector: r.organizacion.sector,
                contactoNombre: r.contacto
                    ? fullName(r.contacto.nombres, r.contacto.apellidos)
                    : null,
                contactoCorreo: r.contacto?.correo ?? null,
                encargadoNombre: fullName(
                    r.encargado.nombres,
                    r.encargado.apellidos,
                ),
                proximaActividadNombre: pending?.nombreActividad ?? null,
                proximaActividadFecha: pending?.fechaInicio ?? null,
                // "Alerta" = existe una actividad pendiente cuya fecha fin ya pasó.
                tieneAlertaActividad: pending
                    ? pending.fechaFin.getTime() < now.getTime()
                    : false,
            };
        });
    }

    async findCotizaciones(opts?: {
        filters?: CotizacionExportFilters;
    }): Promise<CotizacionExportRow[]> {
        const f = opts?.filters ?? {};
        // No exportar cotizaciones cuyo lead u organización fueron eliminados
        // (soft delete).
        const where: Prisma.CotizacionWhereInput = {
            deletedAt: null,
            lead: { deletedAt: null, organizacion: { deletedAt: null } },
        };
        if (f.cliente) {
            where.cliente = contains(f.cliente);
        }
        if (f.servicio) {
            where.nombreServicio = contains(f.servicio);
        }
        if (f.estado) {
            where.estado = f.estado as EstadoCot;
        }

        const records = await this.prisma.cotizacion.findMany({
            where,
            orderBy: { id: 'asc' },
        });

        return records.map((r) => ({
            id: r.id,
            idLead: r.idLead,
            fechaCot: r.fechaCot,
            dirigido: r.dirigido,
            cliente: r.cliente,
            producto: r.producto,
            nombreServicio: r.nombreServicio,
            monto: r.monto.toString(),
            tipo: r.tipo,
            estado: r.estado,
            nombreRemitente: r.nombreRemitente,
            observacion: r.observacion,
            linkPropuesta: r.linkPropuesta,
        }));
    }
}
