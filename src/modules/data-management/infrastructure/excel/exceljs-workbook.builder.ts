import { Injectable } from '@nestjs/common';
import { Workbook, Worksheet } from 'exceljs';
import {
    IWorkbookBuilder,
    SheetDefinition,
} from '@/modules/data-management/domain/ports/workbook-builder.port';

/** Filas a las que se aplica la validación de lista desplegable en plantillas. */
const VALIDATION_ROWS = 300;

/** Convierte un índice de columna 1-based en su letra ("A", "B", ..., "AA"). */
function columnLetter(index: number): string {
    let result = '';
    let n = index;
    while (n > 0) {
        const remainder = (n - 1) % 26;
        result = String.fromCharCode(65 + remainder) + result;
        n = Math.floor((n - 1) / 26);
    }
    return result;
}

@Injectable()
export class ExceljsWorkbookBuilder implements IWorkbookBuilder {
    async build(sheets: SheetDefinition[]): Promise<Buffer> {
        const workbook = new Workbook();
        workbook.creator = 'Bioactiva CRM';
        workbook.created = new Date();

        // Hoja oculta donde viven los valores de las listas desplegables. Se
        // referencia por rango (Listas!$A$1:$A$n), evitando el límite de 255
        // caracteres de las listas en línea (importa para "Sector").
        let listsSheet: Worksheet | undefined;
        let listColumnCount = 0;
        const listRangeByValues = new Map<string, string>();

        const ensureListRange = (values: string[]): string => {
            const cacheKey = values.join('');
            const cached = listRangeByValues.get(cacheKey);
            if (cached) {
                return cached;
            }
            if (!listsSheet) {
                listsSheet = workbook.addWorksheet('Listas');
                listsSheet.state = 'veryHidden';
            }
            listColumnCount += 1;
            const letter = columnLetter(listColumnCount);
            values.forEach((value, i) => {
                listsSheet!.getCell(`${letter}${i + 1}`).value = value;
            });
            const range = `Listas!$${letter}$1:$${letter}$${values.length}`;
            listRangeByValues.set(cacheKey, range);
            return range;
        };

        for (const sheet of sheets) {
            const worksheet = workbook.addWorksheet(sheet.name);
            worksheet.columns = sheet.columns.map((col) => ({
                header: col.header,
                key: col.key,
                width: col.width ?? 20,
            }));

            // Cabecera en negrita y congelada para que no se pierda al desplazar.
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            worksheet.views = [{ state: 'frozen', ySplit: 1 }];

            sheet.columns.forEach((col, idx) => {
                const headerCell = headerRow.getCell(idx + 1);
                // Las columnas obligatorias se resaltan en azul claro.
                if (col.required) {
                    headerCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFBDD7EE' },
                    };
                }
                if (col.note) {
                    headerCell.note = col.note;
                }
                const formula =
                    col.dropdownFormula ??
                    (col.dropdown && col.dropdown.length > 0
                        ? ensureListRange(col.dropdown)
                        : null);
                if (formula) {
                    const letter = columnLetter(idx + 1);
                    for (let r = 2; r <= VALIDATION_ROWS + 1; r++) {
                        worksheet.getCell(`${letter}${r}`).dataValidation = {
                            type: 'list',
                            allowBlank: true,
                            formulae: [formula],
                            showErrorMessage: true,
                            errorStyle: 'warning',
                            errorTitle: 'Valor sugerido',
                            error: 'Elige un valor de la lista. También se aceptan equivalentes.',
                        };
                    }
                }
            });

            for (const row of sheet.rows) {
                const added = worksheet.addRow(row);
                if (sheet.highlightWhen?.(row)) {
                    // Resalta en ámbar las filas no vigentes / desactivadas.
                    added.eachCell((cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFE08A' },
                        };
                    });
                }
            }
        }

        const arrayBuffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(arrayBuffer);
    }
}
