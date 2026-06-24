export const DATA_IMPORT_QUEUE = 'DATA_IMPORT_QUEUE';
export const DATA_IMPORT_JOB = 'process-crm-import';

/** Payload del job de importación encolado. El archivo viaja en base64. */
export interface ImportJobData {
    fileBase64: string;
    filename: string;
    userId: number;
}
