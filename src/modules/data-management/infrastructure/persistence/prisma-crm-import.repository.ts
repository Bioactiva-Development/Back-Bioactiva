import { Injectable } from '@nestjs/common';
import type {
    Prisma,
    TipoEmpresa,
    Tamano,
    Sector,
    Vocativo,
    LeadState,
    TipoActividad,
    TipoMoneda,
    EstadoCot,
} from '@prisma/client';
import { PrismaService } from '@/modules/common/prisma/prisma.service';
import { IImportCommitRepository } from '@/modules/data-management/domain/ports/crm-import.repository';
import {
    ImportPlan,
    ImportSummary,
    OrgInput,
    LeadInput,
} from '@/modules/data-management/application/dto/import-types';
import { normalizeCell } from '@/modules/data-management/domain/constants/normalize';

type TxClient = Prisma.TransactionClient;

type OrgMaps = {
    orgIdByRuc: Map<string, string>;
    orgIdByComercial: Map<string, string>;
    orgIdByNombre: Map<string, string>;
    orgNombreComercialById: Map<string, string>;
};

type ContactMaps = {
    contactIdByCorreo: Map<string, number>;
    contactNombreById: Map<number, string>;
};

type LeadMaps = {
    leadIdByExcelId: Map<string, number>;
    leadMetaByExcelId: Map<
        string,
        { orgId: string; contactoId: number | null; encargadoId: number }
    >;
};

type UserRow = { id: number; nombres: string; apellidos: string };

@Injectable()
export class PrismaCrmImportRepository implements IImportCommitRepository {
    constructor(private readonly prisma: PrismaService) {}

    async commit(
        plan: ImportPlan,
        ctx: { authorUserId: number },
    ): Promise<ImportSummary> {
        const summary: ImportSummary = {
            inserted: {
                organizaciones: 0,
                contactos: 0,
                leads: 0,
                actividades: 0,
                cotizaciones: 0,
            },
            skipped: [],
            warnings: [],
        };

        await this.prisma.$transaction(
            async (tx) => {
                const users = await tx.usuario.findMany({
                    select: { id: true, nombres: true, apellidos: true },
                });
                const userMap = this.buildUserMap(users);
                const orgMaps = await this.processOrgs(tx, plan, ctx, summary);
                const contactMaps = await this.processContacts(
                    tx,
                    plan,
                    ctx,
                    summary,
                    orgMaps,
                );
                const leadMaps = await this.processLeads(
                    tx,
                    plan,
                    ctx,
                    summary,
                    users,
                    userMap,
                    orgMaps,
                    contactMaps,
                );
                await this.processCotizaciones(
                    tx,
                    plan,
                    ctx,
                    summary,
                    users,
                    leadMaps,
                    orgMaps,
                    contactMaps,
                );
            },
            { timeout: 120_000, maxWait: 10_000 },
        );

        return summary;
    }

    private buildUserMap(users: UserRow[]): Map<string, number> {
        const map = new Map<string, number>();
        for (const u of users) {
            map.set(normalizeCell(`${u.nombres} ${u.apellidos}`), u.id);
        }
        return map;
    }

    private static resolveOrgId(
        ruc: string | null,
        nombre: string | null,
        orgIdByRuc: Map<string, string>,
        orgIdByComercial: Map<string, string>,
        orgIdByNombre: Map<string, string>,
    ): string | undefined {
        if (ruc) {
            const byRuc = orgIdByRuc.get(ruc);
            if (byRuc) return byRuc;
        }
        if (nombre) {
            const key = normalizeCell(nombre);
            return orgIdByComercial.get(key) ?? orgIdByNombre.get(key);
        }
        return undefined;
    }

    private findDupOrgId(
        org: OrgInput,
        orgIdByRuc: Map<string, string>,
        orgIdByComercial: Map<string, string>,
        orgIdByNombre: Map<string, string>,
    ): string | undefined {
        if (org.ruc) {
            const byRuc = orgIdByRuc.get(org.ruc);
            if (byRuc) return byRuc;
        }
        return (
            orgIdByNombre.get(normalizeCell(org.nombre)) ??
            orgIdByComercial.get(normalizeCell(org.nombreComercial))
        );
    }

    private async processOrgs(
        tx: TxClient,
        plan: ImportPlan,
        ctx: { authorUserId: number },
        summary: ImportSummary,
    ): Promise<OrgMaps> {
        const orgIdByRuc = new Map<string, string>();
        const orgIdByComercial = new Map<string, string>();
        const orgIdByNombre = new Map<string, string>();
        const orgNombreComercialById = new Map<string, string>();

        const existingOrgs = await tx.organizacion.findMany({
            select: {
                id: true,
                ruc: true,
                nombre: true,
                nombreComercial: true,
                codigoCliente: true,
            },
        });
        const usedCodigos = new Set<string>();
        for (const o of existingOrgs) {
            usedCodigos.add(o.codigoCliente);
            if (o.ruc) orgIdByRuc.set(o.ruc, o.id);
            orgIdByComercial.set(normalizeCell(o.nombreComercial), o.id);
            orgIdByNombre.set(normalizeCell(o.nombre), o.id);
            orgNombreComercialById.set(o.id, o.nombreComercial);
        }

        for (const org of plan.organizaciones) {
            const dupId = this.findDupOrgId(
                org,
                orgIdByRuc,
                orgIdByComercial,
                orgIdByNombre,
            );
            if (dupId) {
                summary.skipped.push({
                    sheet: 'Organizaciones',
                    row: org.rowNumber,
                    message: 'La organización ya existe; omitida.',
                });
                if (org.ruc) orgIdByRuc.set(org.ruc, dupId);
                orgIdByComercial.set(normalizeCell(org.nombreComercial), dupId);
                orgIdByNombre.set(normalizeCell(org.nombre), dupId);
                continue;
            }

            let codigo = org.codigoCliente;
            let suffix = 2;
            while (usedCodigos.has(codigo)) {
                codigo = `${org.codigoCliente.slice(0, 17)}-${suffix}`.slice(
                    0,
                    20,
                );
                suffix++;
            }
            usedCodigos.add(codigo);

            const created = await tx.organizacion.create({
                data: {
                    codigoCliente: codigo,
                    nombre: org.nombre,
                    nombreComercial: org.nombreComercial,
                    ruc: org.ruc,
                    tipo: org.tipo as TipoEmpresa,
                    tamano: org.tamano as Tamano,
                    sector: org.sector as Sector,
                    subArea: org.subArea,
                    linkedin: org.linkedin,
                    ubicacion: org.ubicacion,
                    actividadEconomica: org.actividadEconomica,
                    alianzasEstrategicas: org.alianzasEstrategicas,
                    idAuthor: ctx.authorUserId,
                },
                select: { id: true },
            });
            summary.inserted.organizaciones++;
            if (org.ruc) orgIdByRuc.set(org.ruc, created.id);
            orgIdByComercial.set(
                normalizeCell(org.nombreComercial),
                created.id,
            );
            orgIdByNombre.set(normalizeCell(org.nombre), created.id);
            orgNombreComercialById.set(created.id, org.nombreComercial);
        }

        return {
            orgIdByRuc,
            orgIdByComercial,
            orgIdByNombre,
            orgNombreComercialById,
        };
    }

    private async processContacts(
        tx: TxClient,
        plan: ImportPlan,
        ctx: { authorUserId: number },
        summary: ImportSummary,
        orgMaps: OrgMaps,
    ): Promise<ContactMaps> {
        const { orgIdByRuc, orgIdByComercial, orgIdByNombre } = orgMaps;
        const contactIdByCorreo = new Map<string, number>();
        const contactNombreById = new Map<number, string>();

        const existingContacts = await tx.contacto.findMany({
            select: { id: true, correo: true, nombres: true, apellidos: true },
        });
        for (const c of existingContacts) {
            contactIdByCorreo.set(normalizeCell(c.correo), c.id);
            contactNombreById.set(
                c.id,
                [c.nombres, c.apellidos].filter(Boolean).join(' ').trim(),
            );
        }

        for (const c of plan.contactos) {
            const correoKey = normalizeCell(c.correo);
            if (contactIdByCorreo.has(correoKey)) {
                summary.skipped.push({
                    sheet: 'Contactos',
                    row: c.rowNumber,
                    message: 'El contacto (correo) ya existe; omitido.',
                });
                continue;
            }
            const orgId = PrismaCrmImportRepository.resolveOrgId(
                c.orgRuc,
                c.orgNombreComercial,
                orgIdByRuc,
                orgIdByComercial,
                orgIdByNombre,
            );
            if (!orgId) {
                summary.skipped.push({
                    sheet: 'Contactos',
                    row: c.rowNumber,
                    message:
                        'No se encontró la organización del contacto; omitido.',
                });
                continue;
            }
            const created = await tx.contacto.create({
                data: {
                    nombres: c.nombres,
                    apellidos: c.apellidos,
                    vocativo: (c.vocativo as Vocativo | null) ?? null,
                    cargo: c.cargo,
                    correo: c.correo,
                    correo2: c.correo2,
                    telefono: c.telefono,
                    comentarios: c.comentarios,
                    idOrganizacion: orgId,
                    idAuthor: ctx.authorUserId,
                },
                select: { id: true },
            });
            summary.inserted.contactos++;
            contactIdByCorreo.set(correoKey, created.id);
            contactNombreById.set(
                created.id,
                [c.nombres, c.apellidos].filter(Boolean).join(' ').trim(),
            );
        }

        return { contactIdByCorreo, contactNombreById };
    }

    private resolveEncargadoId(
        userMap: Map<string, number>,
        l: LeadInput,
        ctx: { authorUserId: number },
        summary: ImportSummary,
    ): number {
        if (!l.encargadoNombre) return ctx.authorUserId;
        const found = userMap.get(normalizeCell(l.encargadoNombre));
        if (found) return found;
        summary.warnings.push({
            sheet: 'Leads',
            row: l.rowNumber,
            message: `Encargado "${l.encargadoNombre}" no existe; asignado al usuario importador.`,
        });
        return ctx.authorUserId;
    }

    private async maybeCreateActivity(
        tx: TxClient,
        l: LeadInput,
        leadId: number,
        encargadoId: number,
        summary: ImportSummary,
    ): Promise<void> {
        if (!l.actividad) return;
        const fecha = l.actividad.fecha ?? new Date();
        await tx.actividad.create({
            data: {
                nombreActividad: l.actividad.nombre,
                fechaInicio: fecha,
                fechaFin: fecha,
                tipo: l.actividad.tipo as TipoActividad,
                idLead: leadId,
                idResponsable: encargadoId,
                outlookImported: false,
                seguimientoAutomatico: false,
            },
        });
        summary.inserted.actividades++;
    }

    private async maybeCreateAutoCotizacion(
        tx: TxClient,
        l: LeadInput,
        leadId: number,
        orgId: string,
        contactoId: number | null,
        encargadoId: number,
        users: UserRow[],
        orgMaps: OrgMaps,
        contactMaps: ContactMaps,
        ctx: { authorUserId: number },
        summary: ImportSummary,
    ): Promise<void> {
        if (!l.autoCreateCotizacion) return;
        const { orgNombreComercialById } = orgMaps;
        const { contactNombreById } = contactMaps;
        const encargado = users.find((u) => u.id === encargadoId);
        const nombreRemitente = encargado
            ? [encargado.nombres, encargado.apellidos]
                  .filter(Boolean)
                  .join(' ')
                  .trim()
            : 'Por asignar';
        await tx.cotizacion.create({
            data: {
                fechaCot: new Date(),
                cliente: orgNombreComercialById.get(orgId) ?? null,
                dirigido:
                    contactoId == null
                        ? null
                        : (contactNombreById.get(contactoId) ?? null),
                nombreServicio: l.servicioInteres,
                nombreRemitente,
                monto: '0',
                tipo: 'PEN',
                estado: 'PENDIENTE',
                idLead: leadId,
                idRemitente: ctx.authorUserId,
                idAuthor: ctx.authorUserId,
            },
        });
        summary.inserted.cotizaciones++;
    }

    private async processLeads(
        tx: TxClient,
        plan: ImportPlan,
        ctx: { authorUserId: number },
        summary: ImportSummary,
        users: UserRow[],
        userMap: Map<string, number>,
        orgMaps: OrgMaps,
        contactMaps: ContactMaps,
    ): Promise<LeadMaps> {
        const { orgIdByRuc, orgIdByComercial, orgIdByNombre } = orgMaps;
        const { contactIdByCorreo } = contactMaps;
        const leadIdByExcelId = new Map<string, number>();
        const leadMetaByExcelId = new Map<
            string,
            { orgId: string; contactoId: number | null; encargadoId: number }
        >();

        for (const l of plan.leads) {
            const orgId = PrismaCrmImportRepository.resolveOrgId(
                l.orgRuc,
                l.orgNombreComercial,
                orgIdByRuc,
                orgIdByComercial,
                orgIdByNombre,
            );
            if (!orgId) {
                summary.skipped.push({
                    sheet: 'Leads',
                    row: l.rowNumber,
                    message:
                        'No se encontró la organización del lead; omitido.',
                });
                continue;
            }
            const contactoId = l.contactoCorreo
                ? (contactIdByCorreo.get(normalizeCell(l.contactoCorreo)) ??
                  null)
                : null;
            const encargadoId = this.resolveEncargadoId(
                userMap,
                l,
                ctx,
                summary,
            );
            const createdAt = l.createdAt ?? undefined;
            const createdLead = await tx.lead.create({
                data: {
                    estado: l.estado as LeadState,
                    servicioInteres: l.servicioInteres,
                    comentarios: l.comentarios,
                    desafioOportunidad: l.desafioOportunidad,
                    canalCaptacion: l.canalCaptacion,
                    idOrg: orgId,
                    idContacto: contactoId,
                    idEncargado: encargadoId,
                    idAuthor: ctx.authorUserId,
                    ...(createdAt ? { createdAt } : {}),
                    ...(createdAt ? { ultimoCambioEstado: createdAt } : {}),
                    fechaCierre: l.fechaCierre,
                },
                select: { id: true },
            });
            summary.inserted.leads++;
            if (l.excelLeadId) {
                const key = String(l.excelLeadId).trim();
                leadIdByExcelId.set(key, createdLead.id);
                leadMetaByExcelId.set(key, { orgId, contactoId, encargadoId });
            }
            await this.maybeCreateActivity(
                tx,
                l,
                createdLead.id,
                encargadoId,
                summary,
            );
            await this.maybeCreateAutoCotizacion(
                tx,
                l,
                createdLead.id,
                orgId,
                contactoId,
                encargadoId,
                users,
                orgMaps,
                contactMaps,
                ctx,
                summary,
            );
        }

        return { leadIdByExcelId, leadMetaByExcelId };
    }

    private buildCotDerivedFields(
        meta:
            | { orgId: string; contactoId: number | null; encargadoId: number }
            | undefined,
        users: UserRow[],
        orgNombreComercialById: Map<string, string>,
        contactNombreById: Map<number, string>,
    ): {
        cliente: string | null;
        dirigido: string | null;
        nombreRemitente: string;
    } {
        const cliente = meta
            ? (orgNombreComercialById.get(meta.orgId) ?? null)
            : null;
        const dirigido =
            meta?.contactoId == null
                ? null
                : (contactNombreById.get(meta.contactoId) ?? null);
        const encargado = meta
            ? users.find((u) => u.id === meta.encargadoId)
            : undefined;
        const nombreRemitente = encargado
            ? [encargado.nombres, encargado.apellidos]
                  .filter(Boolean)
                  .join(' ')
                  .trim()
            : 'Por asignar';
        return { cliente, dirigido, nombreRemitente };
    }

    private async processCotizaciones(
        tx: TxClient,
        plan: ImportPlan,
        ctx: { authorUserId: number },
        summary: ImportSummary,
        users: UserRow[],
        leadMaps: LeadMaps,
        orgMaps: OrgMaps,
        contactMaps: ContactMaps,
    ): Promise<void> {
        const { leadIdByExcelId, leadMetaByExcelId } = leadMaps;
        const { orgNombreComercialById } = orgMaps;
        const { contactNombreById } = contactMaps;

        for (const q of plan.cotizaciones) {
            const leadKey = q.excelLeadId ? String(q.excelLeadId).trim() : null;
            const leadId = leadKey ? leadIdByExcelId.get(leadKey) : undefined;
            if (!leadId) {
                summary.skipped.push({
                    sheet: 'Cotizaciones',
                    row: q.rowNumber,
                    message: `No se encontró el lead "${q.excelLeadId ?? ''}" (debe estar en la hoja Leads del mismo archivo); cotización omitida.`,
                });
                continue;
            }
            const meta = leadKey ? leadMetaByExcelId.get(leadKey) : undefined;
            const { cliente, dirigido, nombreRemitente } =
                this.buildCotDerivedFields(
                    meta,
                    users,
                    orgNombreComercialById,
                    contactNombreById,
                );
            await tx.cotizacion.create({
                data: {
                    fechaCot: q.fechaCot,
                    dirigido,
                    cliente,
                    producto: q.producto,
                    nombreRemitente,
                    nombreServicio: q.nombreServicio,
                    monto: q.monto,
                    tipo: q.tipo as TipoMoneda,
                    estado: q.estado as EstadoCot,
                    observacion: q.observacion,
                    linkPropuesta: q.linkPropuesta,
                    idLead: leadId,
                    idRemitente: ctx.authorUserId,
                    idAuthor: ctx.authorUserId,
                },
            });
            summary.inserted.cotizaciones++;
        }
    }
}
