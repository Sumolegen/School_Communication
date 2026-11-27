import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsDateOnlyString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDateOnlyString',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be in YYYY-MM-DD format`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
          const parsed = new Date(`${value}T00:00:00.000Z`);
          return !Number.isNaN(parsed.getTime());
        },
      },
    });
  };
}
