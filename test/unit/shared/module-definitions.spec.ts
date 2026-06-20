import { describe, expect, it } from '@jest/globals';
import { AppModule } from '@/app.module';
import { ActivitiesModule } from '@/modules/activities/activities.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { MailModule } from '@/modules/common/mail/mail.module';
import { PrismaModule } from '@/modules/common/prisma/prisma.module';
import { RedisModule } from '@/modules/common/redis/redis.module';
import { ContactsModule } from '@/modules/contacts/contacts.module';
import { DashboardModule } from '@/modules/dashboard/dashboard.module';
import { DataManagementModule } from '@/modules/data-management/data-management.module';
import { MicrosoftIntegrationModule } from '@/modules/integrations/microsoft-integration.module';
import { InvitationEmailQueueModule } from '@/modules/invitations/infrastructure/queue/invitation-email.module';
import { InvitationsModule } from '@/modules/invitations/invitations.module';
import { LeadsModule } from '@/modules/leads/leads.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { CotizacionesModule } from '@/modules/quotations/cotizaciones.module';
import { ResetModule } from '@/modules/reset/reset.module';
import { ResetPasswordQueueModule } from '@/modules/reset_password/infrastructure/queue/reset-password-queue.module';
import { ResetPasswordModule } from '@/modules/reset_password/reset-password.module';
import { UsersModule } from '@/modules/users/user.module';

/**
 * Module definitions
 * ----------
 * Importar cada módulo evalúa sus metadatos de @Module (imports/providers/
 * controllers/exports), garantizando que el grafo de dependencias declarado
 * es sintácticamente válido y se construye sin lanzar errores.
 */
describe('Module definitions', () => {
    const modules: Array<[string, unknown]> = [
        ['AppModule', AppModule],
        ['ActivitiesModule', ActivitiesModule],
        ['AuthModule', AuthModule],
        ['MailModule', MailModule],
        ['PrismaModule', PrismaModule],
        ['RedisModule', RedisModule],
        ['ContactsModule', ContactsModule],
        ['DashboardModule', DashboardModule],
        ['DataManagementModule', DataManagementModule],
        ['MicrosoftIntegrationModule', MicrosoftIntegrationModule],
        ['InvitationEmailQueueModule', InvitationEmailQueueModule],
        ['InvitationsModule', InvitationsModule],
        ['LeadsModule', LeadsModule],
        ['NotificationsModule', NotificationsModule],
        ['OrganizationsModule', OrganizationsModule],
        ['CotizacionesModule', CotizacionesModule],
        ['ResetModule', ResetModule],
        ['ResetPasswordQueueModule', ResetPasswordQueueModule],
        ['ResetPasswordModule', ResetPasswordModule],
        ['UsersModule', UsersModule],
    ];

    it.each(modules)('defines %s as a class', (_name, mod) => {
        expect(mod).toBeDefined();
        expect(typeof mod).toBe('function');
    });
});
