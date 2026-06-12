import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PasswordHasherPort } from '@/modules/auth/domain/ports/password-hasher.port';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasherPort {
    async hash(password: string): Promise<string> {
        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
        return bcrypt.hash(password, saltRounds);
    }

    async compare(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }
}
