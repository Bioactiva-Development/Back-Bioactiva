import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import {
    IWorkbookBuilder,
    SheetDefinition,
} from '@/modules/data-management/domain/ports/workbook-builder.port';

@Injectable()
export class ExceljsWorkbookBuilder implements IWorkbookBuilder {
    async build(sheets: SheetDefinition[]): Promise<Buffer> {
        const workbook = new Workbook();
        workbook.creator = 'Bioactiva CRM';
        workbook.created = new Date();

        for (const sheet of sheets) {
            const worksheet = workbook.addWorksheet(sheet.name);
            worksheet.columns = sheet.columns.map((col) => ({
                header: col.header,
                key: col.key,
                width: col.width ?? 20,
            }));

            // Cabecera en negrita.
            worksheet.getRow(1).font = { bold: true };

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
