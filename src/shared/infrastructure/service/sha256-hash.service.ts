import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';

import { HashServicePort } from '@/shared/domain/ports/hash-service.port';

@Injectable()
export class Sha256HashService implements HashServicePort {
    hash(value: string): string {
        return createHash('sha256').update(value).digest('hex');
    }

    compare(plain: string, hashed: string): boolean {
        const plainHashed = this.hash(plain);

        return plainHashed === hashed;
    }
}
