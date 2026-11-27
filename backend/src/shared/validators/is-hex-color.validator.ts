import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsHexColorCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isHexColorCode',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid hex color code like #0F294A`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
        },
      },
    });
  };
}
