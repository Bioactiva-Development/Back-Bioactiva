import { HttpStatus } from '@nestjs/common';
import { EmailAlreadyExistsException } from '@/modules/contacts/domain/exceptions/email-already-exists.exception';
import { ContactNotFoundException } from '@/modules/contacts/domain/exceptions/contact-not-found.exception';
import { OrganizationAlreadyExistsException } from '@/modules/organizations/domain/exceptions/organization-already-exists.exception';
import { InvalidRucException } from '@/modules/organizations/domain/exceptions/invalid-ruc.exception';

// Mapeamos el nombre de la clase de excepción a su respectivo código HTTP
export const DOMAIN_ERROR_MAP: Record<string, number> = {
    [EmailAlreadyExistsException.name]: HttpStatus.CONFLICT, // Devuelve 409
    [ContactNotFoundException.name]: HttpStatus.NOT_FOUND, // Devuelve 404
    [OrganizationAlreadyExistsException.name]: HttpStatus.CONFLICT, // Devuelve 409
    [InvalidRucException.name]: HttpStatus.BAD_REQUEST, // Devuelve 400
};
