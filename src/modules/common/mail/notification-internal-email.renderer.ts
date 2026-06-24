import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type NotificationInternalEmailInput = {
    subject: string;
    bodyHtml: string;
    leadLink: string;
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

    const candidates = [
        join(__dirname, 'templates', 'notification-internal.html'),
        join(
            process.cwd(),
            'src',
            'modules',
            'common',
            'mail',
            'templates',
            'notification-internal.html',
        ),
    ];

    for (const path of candidates) {
        try {
            cachedTemplate = readFileSync(path, 'utf8');
            return cachedTemplate;
        } catch {
            continue;
        }
    }

    throw new Error('No se pudo cargar la plantilla de notificación interna');
}

export function renderNotificationInternalEmail(
    input: NotificationInternalEmailInput,
): string {
    const template = loadTemplate();
    const safeSubject = escapeHtml(input.subject);
    const safeLink = escapeHtml(input.leadLink);

    return template
        .replaceAll('{{subject}}', safeSubject)
        .replaceAll('{{bodyHtml}}', input.bodyHtml)
        .replaceAll('{{leadLink}}', safeLink);
}
