import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';

/**
 * Valida que la fecha del campo decorado sea posterior o igual a la fecha
 * de otro campo del mismo DTO. Si alguno de los dos valores está ausente o
 * no es una fecha parseable, no falla (deja que @IsDateString reporte el
 * formato). Pensado para rangos del tipo fechaDesde / fechaHasta.
 */
export function IsAfterOrEqualDate(
    relatedProperty: string,
    validationOptions?: ValidationOptions,
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isAfterOrEqualDate',
            target: object.constructor,
            propertyName,
            constraints: [relatedProperty],
            options: validationOptions,
            validator: {
                validate(value: unknown, args: ValidationArguments): boolean {
                    const [related] = args.constraints as [string];
                    const relatedValue = (
                        args.object as Record<string, unknown>
                    )[related];

                    if (value == null || relatedValue == null) return true;

                    const current = new Date(value as string).getTime();
                    const other = new Date(relatedValue as string).getTime();

                    if (Number.isNaN(current) || Number.isNaN(other)) {
                        return true;
                    }

                    return current >= other;
                },
                defaultMessage(args: ValidationArguments): string {
                    const [related] = args.constraints as [string];
                    return `${args.property} debe ser posterior o igual a ${related}`;
                },
            },
        });
    };
}
