import { describe, expect, it } from '@jest/globals';
import { LeadHasNoActiveActivityException } from '@/modules/notifications/domain/exceptions/lead-has-no-active-activity.exception';

describe('Notifications module — LeadHasNoActiveActivityException branches2', () => {
    it('uses the default message when constructed with no argument', () => {
        const exception = new LeadHasNoActiveActivityException();
        expect(exception.message).toBe(
            'El lead no tiene una actividad activa a la que asociar la notificación',
        );
    });
});
