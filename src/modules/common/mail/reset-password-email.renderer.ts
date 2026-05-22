import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type ResetPasswordEmailTemplateInput = {
    correo: string;
    token: string;
};

let cachedTemplate: string | null = null;

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function loadTemplate(): string {
    if (cachedTemplate) {
        return cachedTemplate;
    }

    const templateCandidates = [
        join(__dirname, 'templates', 'reset-password.html'),
        join(
            process.cwd(),
            'src',
            'modules',
            'common',
            'mail',
            'templates',
            'reset-password.html',
        ),
    ];

    for (const templatePath of templateCandidates) {
        try {
            cachedTemplate = readFileSync(templatePath, 'utf8');
            return cachedTemplate;
        } catch {
            continue;
        }
    }

    throw new Error('No se pudo cargar la plantilla de restablecimiento de contraseña');
}

export function renderResetPasswordEmailTemplate(
    input: ResetPasswordEmailTemplateInput,
): string {
    const template = loadTemplate();
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${input.token}`;

    return template
        .replaceAll('{{recipientEmail}}', escapeHtml(input.correo))
        .replaceAll('{{resetLink}}', escapeHtml(resetLink));
}
