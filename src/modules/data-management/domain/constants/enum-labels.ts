/**
 * Etiquetas canónicas en español para los valores de enum, usadas al EXPORTAR.
 * Son la cara legible del CRM en el Excel. El vocabulario de LeadState replica el
 * del archivo de referencia (`docs/crm_bioactiva_final.xlsx`) para que un export
 * pueda volver a importarse sin pérdida (round-trip).
 */

export const TIPO_EMPRESA_LABEL: Record<string, string> = {
    ACADEMIA: 'Academia',
    EMPRESA_INTERNACIONAL: 'Empresa internacional',
    EMPRESA_NACIONAL: 'Empresa nacional',
    GOBIERNO_NACIONAL: 'Gobierno nacional',
    INDEPENDIENTE: 'Independiente',
    ONG: 'ONG',
    ORGANISMO_INTERNACIONAL: 'Organismo internacional',
};

export const TAMANO_LABEL: Record<string, string> = {
    GRANDE: 'Grande',
    MEDIANO: 'Mediano',
    PEQUENO: 'Pequeña',
    MICRO: 'Micro',
};

export const SECTOR_LABEL: Record<string, string> = {
    ACUICULTURA: 'Acuicultura',
    ADMINISTRACION_PUBLICA: 'Administración pública',
    AGRICOLA: 'Agrícola',
    AGROALIMENTARIA: 'Agroalimentaria',
    AGROPECUARIO: 'Agropecuario',
    ALIMENTARIA: 'Alimentaria',
    ASESORIA: 'Asesoría',
    BANCA_Y_SEGUROS: 'Banca y seguros',
    CONSTRUCCION: 'Construcción',
    CONSULTORIA: 'Consultoría',
    COOPERACION_TECNICA: 'Cooperación técnica',
    EDUCACION: 'Educación',
    ENERGIA: 'Energía',
    FERRETERIA: 'Ferretería',
    FINANZAS: 'Finanzas',
    FORESTAL: 'Forestal',
    GANADERIA: 'Ganadería',
    INFORMATICA: 'Informática',
    MANUFACTURA: 'Manufactura',
    MINERIA: 'Minería',
    OTROS: 'Otros',
    PESCA: 'Pesca',
    SALUD: 'Salud',
    TECNOLOGIA: 'Tecnología',
    TEXTIL: 'Textil',
    TRANSFORMACION: 'Transformación',
    TURISMO: 'Turismo',
};

export const VOCATIVO_LABEL: Record<string, string> = {
    SR: 'Sr.',
    SRA: 'Sra.',
    SRTA: 'Srta.',
};

export const ESTADO_CORREO_LABEL: Record<string, string> = {
    VIGENTE: 'Vigente',
    VENCIDO: 'Vencido',
};

export const LEAD_STATE_LABEL: Record<string, string> = {
    EN_PROSPECTO: 'En prospecto',
    OFERTADO: 'Ofertado',
    CIERRE_CON_VENTA: 'Cierre con venta',
    CIERRE_SIN_VENTA: 'Cierre sin venta',
};

export const TIPO_ACTIVIDAD_LABEL: Record<string, string> = {
    REUNION: 'Reunión',
    LLAMADA: 'Llamada',
    EMAIL: 'Email',
    OTRO: 'Otro',
};

export const ESTADO_ACTIVIDAD_LABEL: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    REALIZADA: 'Realizada',
    CANCELADA: 'Cancelada',
};

export const TIPO_MONEDA_LABEL: Record<string, string> = {
    PEN: 'PEN',
    USD: 'USD',
};

export const ESTADO_COT_LABEL: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    ENVIADA: 'Enviada',
    ACEPTADA: 'Aceptada',
    RECHAZADA: 'Rechazada',
};

/** Devuelve la etiqueta del valor, o cadena vacía si el valor es nulo. */
export function labelOf(
    map: Record<string, string>,
    value: string | null | undefined,
): string {
    if (value === null || value === undefined) {
        return '';
    }
    return map[value] ?? value;
}
