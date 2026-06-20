import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import { ExtractCookie } from '@/modules/auth/infrastructure/http/decorator/cookie.decorator';
import { CurrentUser } from '@/modules/auth/infrastructure/jwt/decorators/current-user.decorator';
import { User } from '@/modules/users/domain/entities/user';

const ROUTE_ARGS_METADATA = '__routeArguments__';

/**
 * Param decorators (factory callbacks)
 * ------------------------------------
 * `createParamDecorator` envuelve un callback que recibe (data, ExecutionContext).
 * Para cubrir ese callback se aplica el enhancer del decorador a un método falso y
 * se recupera el `factory` desde la metadata de route-args de Nest.
 */
const getFactory = (
    decorator: (data?: unknown) => ParameterDecorator,
    data?: unknown,
): ((data: any, ctx: any) => any) => {
    // Cada extracción usa una clase nueva para que la metadata de route-args no
    // colisione entre decoradores aplicados al mismo prototipo compartido.
    class Holder {
        method(_param?: unknown) {}
    }
    decorator(data)(Holder.prototype, 'method', 0);
    const meta = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        Holder,
        'method',
    );
    const key = Object.keys(meta)[0];
    return meta[key].factory;
};

const buildContext = (request: unknown): ExecutionContext =>
    ({
        switchToHttp: () => ({
            getRequest: () => request,
        }),
    }) as unknown as ExecutionContext;

describe('Auth module', () => {
    describe('ExtractCookie param decorator', () => {
        const factory = getFactory(ExtractCookie as any, 'token');

        it('returns the cookie value when present', () => {
            const ctx = buildContext({ cookies: { token: 'abc123' } });
            expect(factory('token', ctx)).toBe('abc123');
        });

        it('returns null when the cookie is missing', () => {
            const ctx = buildContext({ cookies: {} });
            expect(factory('token', ctx)).toBeNull();
        });
    });

    describe('CurrentUser param decorator', () => {
        const factory = getFactory(CurrentUser as any);

        it('returns the authenticated user when present', () => {
            const user = { id: 1 } as unknown as User;
            const ctx = buildContext({ user });
            expect(factory(undefined, ctx)).toBe(user);
        });

        it('returns undefined when there is no user', () => {
            const ctx = buildContext({});
            expect(factory(undefined, ctx)).toBeUndefined();
        });
    });
});
