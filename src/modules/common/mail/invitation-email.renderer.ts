import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { UserRole } from '@/shared/domain/enums/rol';

type InvitationEmailTemplateInput = {
    correo: string;
    token: string;
    rol: UserRole;
    invitedBy: number;
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

function getRoleLabel(role: UserRole): string {
    return role === UserRole.ADMINISTRADOR ? 'Administrador' : 'Trabajador';
}

function loadTemplate(): string {
    if (cachedTemplate) {
        return cachedTemplate;
    }

    const templateCandidates = [
        join(__dirname, 'templates', 'invitation.html'),
        join(
            process.cwd(),
            'src',
            'modules',
            'common',
            'mail',
            'templates',
            'invitation.html',
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

    throw new Error('No se pudo cargar la plantilla de invitación');
}

export function renderInvitationEmailTemplate(
    input: InvitationEmailTemplateInput,
): string {
    const template = loadTemplate();
    const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${input.token}`;

    return template
        .replaceAll('{{recipientEmail}}', escapeHtml(input.correo))
        .replaceAll('{{roleLabel}}', escapeHtml(getRoleLabel(input.rol)))
        .replaceAll('{{invitationLink}}', escapeHtml(invitationLink));
}
