import { Injectable } from '@nestjs/common';
import type {
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
} from '@/modules/data-management/application/dto/import-types';
import { normalizeCell } from '@/modules/data-management/domain/constants/normalize';

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
                // ---- Usuarios (para resolver "Encargado" por nombre) ----
                const users = await tx.usuario.findMany({
                    select: { id: true, nombres: true, apellidos: true },
                });
                const userByName = new Map<string, number>();
                for (const u of users) {
                    userByName.set(
                        normalizeCell(`${u.nombres} ${u.apellidos}`),
                        u.id,
                    );
                }

                // ---- Organizaciones ----
                const orgIdByRuc = new Map<string, string>();
                const orgIdByComercial = new Map<string, string>();
                const orgIdByNombre = new Map<string, string>();
                /** Nombre comercial de cada org (por id) para derivar `cliente` en cotizaciones. */
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
                    orgIdByComercial.set(
                        normalizeCell(o.nombreComercial),
                        o.id,
                    );
                    orgIdByNombre.set(normalizeCell(o.nombre), o.id);
                    orgNombreComercialById.set(o.id, o.nombreComercial);
                }

                for (const org of plan.organizaciones) {
                    const dupId =
                        (org.ruc && orgIdByRuc.get(org.ruc)) ||
                        orgIdByNombre.get(normalizeCell(org.nombre)) ||
                        orgIdByComercial.get(
                            normalizeCell(org.nombreComercial),
                        );
                    if (dupId) {
                        summary.skipped.push({
                            sheet: 'Organizaciones',
                            row: org.rowNumber,
                            message: 'La organización ya existe; omitida.',
                        });
                        // Registrar claves para que contactos/leads la resuelvan
                        // por RUC, nombre comercial o razón social.
                        if (org.ruc) orgIdByRuc.set(org.ruc, dupId);
                        orgIdByComercial.set(
                            normalizeCell(org.nombreComercial),
                            dupId,
                        );
                        orgIdByNombre.set(normalizeCell(org.nombre), dupId);
                        continue;
                    }

                    // Garantizar unicidad del código de cliente generado.
                    let codigo = org.codigoCliente;
                    let suffix = 2;
                    while (usedCodigos.has(codigo)) {
                        codigo =
                            `${org.codigoCliente.slice(0, 17)}-${suffix}`.slice(
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

                // Resuelve la organización de un contacto/lead por RUC (si lo
                // tiene) y, como respaldo, por nombre: coincide tanto contra el
                // nombre comercial como contra la razón social (única). Así el
                // vínculo funciona aunque la organización no tenga RUC.
                const resolveOrgId = (
                    ruc: string | null,
                    nombre: string | null,
                ): string | undefined => {
                    if (ruc) {
                        const byRuc = orgIdByRuc.get(ruc);
                        if (byRuc) {
                            return byRuc;
                        }
                    }
                    if (nombre) {
                        const key = normalizeCell(nombre);
                        return (
                            orgIdByComercial.get(key) ?? orgIdByNombre.get(key)
                        );
                    }
                    return undefined;
                };

                // ---- Contactos ----
                const contactIdByCorreo = new Map<string, number>();
                /** Nombre completo del contacto por id (para derivar `dirigido` en cotizaciones). */
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
                    const orgId = resolveOrgId(
                        c.orgRuc,
                        c.orgNombreComercial,
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

                // ---- Leads (+ Actividad pendiente) ----
                const leadIdByExcelId = new Map<string, number>();
                /** Metadatos del lead para derivar campos de cotización en el paso siguiente. */
                const leadMetaByExcelId = new Map<
                    string,
                    { orgId: string; contactoId: number | null; encargadoId: number }
                >();
                for (const l of plan.leads) {
                    const orgId = resolveOrgId(
                        l.orgRuc,
                        l.orgNombreComercial,
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
                        ? (contactIdByCorreo.get(
                              normalizeCell(l.contactoCorreo),
                          ) ?? null)
                        : null;

                    let encargadoId = ctx.authorUserId;
                    if (l.encargadoNombre) {
                        const found = userByName.get(
                            normalizeCell(l.encargadoNombre),
                        );
                        if (found) {
                            encargadoId = found;
                        } else {
                            summary.warnings.push({
                                sheet: 'Leads',
                                row: l.rowNumber,
                                message: `Encargado "${l.encargadoNombre}" no existe; asignado al usuario importador.`,
                            });
                        }
                    }

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
                            ...(createdAt
                                ? { ultimoCambioEstado: createdAt }
                                : {}),
                            fechaCierre: l.fechaCierre,
                        },
                        select: { id: true },
                    });
                    summary.inserted.leads++;
                    if (l.excelLeadId) {
                        const key = String(l.excelLeadId).trim();
                        leadIdByExcelId.set(key, createdLead.id);
                        leadMetaByExcelId.set(key, {
                            orgId,
                            contactoId,
                            encargadoId,
                        });
                    }

                    if (l.actividad) {
                        const fecha = l.actividad.fecha ?? new Date();
                        await tx.actividad.create({
                            data: {
                                nombreActividad: l.actividad.nombre,
                                fechaInicio: fecha,
                                fechaFin: fecha,
                                tipo: l.actividad.tipo as TipoActividad,
                                idLead: createdLead.id,
                                idResponsable: encargadoId,
                                outlookImported: false,
                                seguimientoAutomatico: false,
                            },
                        });
                        summary.inserted.actividades++;
                    }

                    if (l.autoCreateCotizacion) {
                        const encargado = users.find(
                            (u) => u.id === encargadoId,
                        );
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
                                dirigido: contactoId != null
                                    ? (contactNombreById.get(contactoId) ?? null)
                                    : null,
                                nombreServicio: l.servicioInteres,
                                nombreRemitente,
                                monto: '0',
                                tipo: 'PEN',
                                estado: 'PENDIENTE',
                                idLead: createdLead.id,
                                idRemitente: ctx.authorUserId,
                                idAuthor: ctx.authorUserId,
                            },
                        });
                        summary.inserted.cotizaciones++;
                    }
                }

                // ---- Cotizaciones ----
                for (const q of plan.cotizaciones) {
                    const leadKey = q.excelLeadId
                        ? String(q.excelLeadId).trim()
                        : null;
                    const leadId = leadKey
                        ? leadIdByExcelId.get(leadKey)
                        : undefined;
                    if (!leadId) {
                        summary.skipped.push({
                            sheet: 'Cotizaciones',
                            row: q.rowNumber,
                            message: `No se encontró el lead "${q.excelLeadId ?? ''}" (debe estar en la hoja Leads del mismo archivo); cotización omitida.`,
                        });
                        continue;
                    }
                    const meta = leadKey
                        ? leadMetaByExcelId.get(leadKey)
                        : undefined;
                    const cliente = meta
                        ? (orgNombreComercialById.get(meta.orgId) ?? null)
                        : null;
                    const dirigido =
                        meta?.contactoId != null
                            ? (contactNombreById.get(meta.contactoId) ?? null)
                            : null;
                    const encargado = meta
                        ? users.find((u) => u.id === meta.encargadoId)
                        : undefined;
                    const nombreRemitente = encargado
                        ? [encargado.nombres, encargado.apellidos]
                              .filter(Boolean)
                              .join(' ')
                              .trim()
                        : 'Por asignar';
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
            },
            { timeout: 120_000, maxWait: 10_000 },
        );

        return summary;
    }
}
