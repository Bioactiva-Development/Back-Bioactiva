import { HttpStatus } from '@nestjs/common';
import { EmailAlreadyExistsException } from '@/modules/contacts/domain/exceptions/email-already-exists.exception';
import { ContactNotFoundException } from '@/modules/contacts/domain/exceptions/contact-not-found.exception';
import { OrganizationAlreadyExistsException } from '@/modules/organizations/domain/exceptions/organization-already-exists.exception';
import { InvalidRucException } from '@/modules/organizations/domain/exceptions/invalid-ruc.exception';

export const DOMAIN_ERROR_MAP: Record<string, number> = {
    [EmailAlreadyExistsException.name]: HttpStatus.CONFLICT,
    [ContactNotFoundException.name]: HttpStatus.NOT_FOUND,
    [OrganizationAlreadyExistsException.name]: HttpStatus.CONFLICT,
    [InvalidRucException.name]: HttpStatus.BAD_REQUEST,
};
