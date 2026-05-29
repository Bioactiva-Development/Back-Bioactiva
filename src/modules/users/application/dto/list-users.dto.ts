import { UserRole } from '@/shared/domain/enums/rol';
import { UserState } from '@/modules/users/domain/enums/estado';

export class ListUsersDto {
    constructor(
        public readonly search?: string,
        public readonly role?: UserRole,
        public readonly estado?: UserState,
        public readonly page: number = 1,
        public readonly limit: number = 10,
    ) {}
}
