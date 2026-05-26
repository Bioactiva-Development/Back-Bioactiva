import { Injectable } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { UserRole } from '@/shared/domain/enums/rol';
import { MailProviderPort } from '@/modules/common/mail/mail-provider.port';
import { renderInvitationEmailTemplate } from '@/modules/common/mail/invitation-email.renderer';
import { renderResetPasswordEmailTemplate } from '@/modules/common/mail/reset-password-email.renderer';

@Injectable()
export class GraphMailProvider implements MailProviderPort {
    private createGraphClient() {
        const msal = new ConfidentialClientApplication({
            auth: {
                clientId: process.env.AZURE_CLIENT_ID ?? '',
                authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
                clientSecret: process.env.AZURE_CLIENT_SECRET ?? '',
            },
        });

        return Client.initWithMiddleware({
            authProvider: {
                getAccessToken: async () => {
                    const token = await msal.acquireTokenByClientCredential({
                        scopes: ['https://graph.microsoft.com/.default'],
                    });

                    return token?.accessToken ?? '';
                },
            },
        });
    }

    async sendInvitationEmail(input: {
        correo: string;
        token: string;
        rol: UserRole;
        invitedBy: number;
    }): Promise<void> {
        const client = this.createGraphClient();

        await client.api(`/users/${process.env.MAIL_FROM}/sendMail`).post({
            message: {
                subject: 'Invitación a Back Bioactiva',
                body: {
                    contentType: 'HTML',
                    content: renderInvitationEmailTemplate(input),
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: input.correo,
                        },
                    },
                ],
            },
            saveToSentItems: true,
        });
    }

    async sendResetPasswordEmail(input: {
        correo: string;
        token: string;
    }): Promise<void> {
        const client = this.createGraphClient();

        await client.api(`/users/${process.env.MAIL_FROM}/sendMail`).post({
            message: {
                subject: 'Restablecer contraseña - Bioactiva',
                body: {
                    contentType: 'HTML',
                    content: renderResetPasswordEmailTemplate(input),
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: input.correo,
                        },
                    },
                ],
            },
            saveToSentItems: true,
        });
    }
}
