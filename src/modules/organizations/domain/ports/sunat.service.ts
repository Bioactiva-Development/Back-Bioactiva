export interface ISunatService {
    validateRuc(ruc: string): Promise<boolean>;
}
export const ISunatService = Symbol('ISunatService');
