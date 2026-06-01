import { LeadState } from '@/modules/leads/domain/enums/lead-state';

export class ChangeLeadStatusDto {
    constructor(public readonly estado: LeadState) {}
}
