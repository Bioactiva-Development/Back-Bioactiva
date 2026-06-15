import { normalizeCell } from './normalize';

/**
 * Mapas de sinónimos (texto del Excel -> valor de enum del dominio) usados al
 * IMPORTAR. Las claves ya están normalizadas (minúsculas, sin acentos ni punto
 * final). Se construyeron a partir de los valores REALES del archivo de
 * referencia `docs/crm_bioactiva_final.xlsx` más las etiquetas canónicas del
 * export, de modo que tanto un archivo del cliente como un export del sistema se
 * importan sin ajustes.
 *
 * Decisiones de mapeo confirmadas con el cliente:
 * - TipoEmpresa: el enum no tiene Cooperativa/Gremio/Empresa pública/Asociación
 *   civil → se colapsan a EMPRESA_NACIONAL / ONG / GOBIERNO_NACIONAL.
 * - Sector: valores sin equivalente (legal, comercio, inmobiliario, etc.) → OTROS.
 * - Vocativo: el enum no tiene Dr./Dra. → se colapsan a SR / SRA.
 * - LeadState: "En proceso" → OFERTADO.
 */

export const TIPO_EMPRESA_SYNONYMS: Record<string, string> = {
    academia: 'ACADEMIA',
    'universidad publica': 'ACADEMIA',
    universidad: 'ACADEMIA',
    'empresa internacional': 'EMPRESA_INTERNACIONAL',
    multinacional: 'EMPRESA_INTERNACIONAL',
    'empresa nacional': 'EMPRESA_NACIONAL',
    cooperativa: 'EMPRESA_NACIONAL',
    'gobierno nacional': 'GOBIERNO_NACIONAL',
    'entidad publica': 'GOBIERNO_NACIONAL',
    'empresa publica': 'GOBIERNO_NACIONAL',
    independiente: 'INDEPENDIENTE',
    ong: 'ONG',
    'asociacion civil': 'ONG',
    gremio: 'ONG',
    'organismo internacional': 'ORGANISMO_INTERNACIONAL',
};

export const TAMANO_SYNONYMS: Record<string, string> = {
    grande: 'GRANDE',
    mediana: 'MEDIANO',
    mediano: 'MEDIANO',
    pequena: 'PEQUENO',
    pequeno: 'PEQUENO',
    micro: 'MICRO',
};

export const SECTOR_SYNONYMS: Record<string, string> = {
    acuicultura: 'ACUICULTURA',
    'administracion publica': 'ADMINISTRACION_PUBLICA',
    agricola: 'AGRICOLA',
    agroalimentaria: 'AGROALIMENTARIA',
    agropecuario: 'AGROPECUARIO',
    'sanidad agraria': 'AGROPECUARIO',
    alimentaria: 'ALIMENTARIA',
    alimentos: 'ALIMENTARIA',
    bebidas: 'ALIMENTARIA',
    asesoria: 'ASESORIA',
    'banca y seguros': 'BANCA_Y_SEGUROS',
    construccion: 'CONSTRUCCION',
    consultoria: 'CONSULTORIA',
    'cooperacion tecnica': 'COOPERACION_TECNICA',
    educacion: 'EDUCACION',
    energia: 'ENERGIA',
    ferreteria: 'FERRETERIA',
    finanzas: 'FINANZAS',
    financiero: 'FINANZAS',
    inversiones: 'FINANZAS',
    forestal: 'FORESTAL',
    ganaderia: 'GANADERIA',
    informatica: 'INFORMATICA',
    manufactura: 'MANUFACTURA',
    mineria: 'MINERIA',
    pesca: 'PESCA',
    salud: 'SALUD',
    tecnologia: 'TECNOLOGIA',
    innovacion: 'TECNOLOGIA',
    textil: 'TEXTIL',
    transformacion: 'TRANSFORMACION',
    turismo: 'TURISMO',
    otros: 'OTROS',
    // Sin equivalente claro en el enum -> OTROS (confirmado con el cliente).
    legal: 'OTROS',
    comercio: 'OTROS',
    'comercio exterior': 'OTROS',
    'medio ambiente': 'OTROS',
    inmobiliario: 'OTROS',
};

export const VOCATIVO_SYNONYMS: Record<string, string> = {
    sr: 'SR',
    senor: 'SR',
    dr: 'SR', // el enum no tiene DR -> SR (confirmado)
    sra: 'SRA',
    senora: 'SRA',
    dra: 'SRA', // el enum no tiene DRA -> SRA (confirmado)
    srta: 'SRTA',
    senorita: 'SRTA',
};

export const ESTADO_CORREO_SYNONYMS: Record<string, string> = {
    vigente: 'VIGENTE',
    vencido: 'VENCIDO',
};

export const LEAD_STATE_SYNONYMS: Record<string, string> = {
    nuevo: 'EN_PROSPECTO',
    'en prospecto': 'EN_PROSPECTO',
    prospecto: 'EN_PROSPECTO',
    'en proceso': 'OFERTADO', // confirmado con el cliente
    ofertado: 'OFERTADO',
    'cerrado ganado': 'CIERRE_CON_VENTA',
    'cierre con venta': 'CIERRE_CON_VENTA',
    'cerrado perdido': 'CIERRE_SIN_VENTA',
    'cierre sin venta': 'CIERRE_SIN_VENTA',
};

export const TIPO_ACTIVIDAD_SYNONYMS: Record<string, string> = {
    reunion: 'REUNION',
    llamada: 'LLAMADA',
    email: 'EMAIL',
    correo: 'EMAIL',
    otro: 'OTRO',
};

export const ESTADO_ACTIVIDAD_SYNONYMS: Record<string, string> = {
    pendiente: 'PENDIENTE',
    realizada: 'REALIZADA',
    cancelada: 'CANCELADA',
};

export const TIPO_MONEDA_SYNONYMS: Record<string, string> = {
    pen: 'PEN',
    's/': 'PEN',
    soles: 'PEN',
    sol: 'PEN',
    usd: 'USD',
    $: 'USD',
    dolares: 'USD',
    dolar: 'USD',
};

export const ESTADO_COT_SYNONYMS: Record<string, string> = {
    pendiente: 'PENDIENTE',
    enviada: 'ENVIADA',
    aceptada: 'ACEPTADA',
    rechazada: 'RECHAZADA',
};

/**
 * Resuelve el texto crudo de una celda a un valor de enum usando el mapa de
 * sinónimos. Devuelve `undefined` si el valor no se reconoce (la fila se
 * rechazará con un error claro, según la regla insert-only acordada).
 */
export function resolveEnum(
    map: Record<string, string>,
    raw: unknown,
): string | undefined {
    const key = normalizeCell(raw);
    if (key === '') {
        return undefined;
    }
    return map[key];
}
