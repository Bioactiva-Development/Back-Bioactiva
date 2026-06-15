import { Injectable } from '@nestjs/common';
import { Workbook, type CellValue, type Row } from 'exceljs';
import {
    IExcelReader,
    ParsedRow,
    ParsedWorkbook,
} from '@/modules/data-management/domain/ports/excel-reader.port';
import { normalizeCell } from '@/modules/data-management/domain/constants/normalize';

/** Extrae un valor primitivo de una celda de exceljs (texto enriquecido, fórmula, hipervínculo). */
function plainValue(value: CellValue): unknown {
    if (value === null || value === undefined) {
        return null;
    }
    if (value instanceof Date) {
        return value;
    }
    if (typeof value === 'object') {
        const obj = value as unknown as Record<string, unknown>;
        // Hipervínculo: { text, hyperlink }
        if ('text' in obj) {
            return obj.text;
        }
        // Fórmula: { formula, result }
        if ('result' in obj) {
            return obj.result;
        }
        // Texto enriquecido: { richText: [{ text }] }
        if ('richText' in obj && Array.isArray(obj.richText)) {
            return (obj.richText as Array<{ text?: string }>)
                .map((part) => part.text ?? '')
                .join('');
        }
        return null;
    }
    return value;
}

@Injectable()
export class ExceljsReader implements IExcelReader {
    async read(buffer: Buffer): Promise<ParsedWorkbook> {
        const workbook = new Workbook();
        await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

        const result: ParsedWorkbook = {};

        workbook.eachSheet((worksheet) => {
            const headerRow = worksheet.getRow(1);
            const headers: { col: number; key: string }[] = [];

            headerRow.eachCell((cell, colNumber) => {
                const raw = plainValue(cell.value);
                const key = normalizeCell(raw);
                if (key !== '') {
                    headers.push({ col: colNumber, key });
                }
            });

            const rows: ParsedRow[] = [];
            worksheet.eachRow((row: Row, rowNumber: number) => {
                if (rowNumber === 1) {
                    return; // cabecera
                }
                const obj: ParsedRow = {};
                let hasData = false;
                for (const { col, key } of headers) {
                    const value = plainValue(row.getCell(col).value);
                    obj[key] = value;
                    if (value !== null && value !== '') {
                        hasData = true;
                    }
                }
                // Guarda el número de fila real del Excel para reportar errores.
                obj.__rowNumber = rowNumber;
                if (hasData) {
                    rows.push(obj);
                }
            });

            result[worksheet.name] = rows;
        });

        return result;
    }
}
