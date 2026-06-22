/**
 * Cache clave-valor con expiración (TTL). Abstracción mínima sobre Redis para no
 * acoplar la lógica de dominio al cliente concreto. Las implementaciones deben ser
 * resilientes: si el backend no está disponible, `get` devuelve `null` (miss) y
 * `set` no lanza, de modo que un fallo de cache nunca rompa la petición.
 */
export interface CachePort {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

export const CACHE_SERVICE = Symbol('CACHE_SERVICE');
