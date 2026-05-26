import { Contact } from '../entities/contact';

export interface IContactRepository {
    // Para Registrar y Editar. Save() es un standar para ambas ops.
    save(contact: Contact): Promise<Contact>; // recibe un objeto tipo contaco y retorna el contacto guardado con su ID generado (en caso de creación) o actualizado (en caso de edición)

    // Para Consultar por ID único
    findById(id: number): Promise<Contact | null>; //recibe el id pero retorna un null en caso no ecnuentra (id no existente) o retorna un contacto real

    // Para la regla de negocio: El correo debe ser único (Punto de control de duplicados)
    findByEmail(email: string): Promise<Contact | null>;

    // Control de duplicados para el correo secundario
    findBySecondaryEmail(email: string): Promise<Contact | null>;

    // Para los Puntos 26, 27 y 28: Obtener contactos filtrados por Organización
    findByOrganizationId(idOrganizacion: string): Promise<Contact[]>; //recibe un id de organizacion y de tipo string y luego promete retornar (osea no instatanemante necesariamente pero si lo hará al fin y al cabo) un arreglo de contactos. No sen neceista que sea null proque de por si el arrelo podria esta vacio y basta con ello.

    // Para el Subpunto 3: Ver todos los contactos en la pestaña principal
    findAll(): Promise<Contact[]>; // Interesante que no solicite nada. ¿Lo usaremos  para filtrar por organizacion o por autor? Por ahora lo dejamos así, pero es algo a considerar para el futuro.
} // creo que el ultimo ya l oimplementó cose
export const IContactRepository = Symbol('IContactRepository');
