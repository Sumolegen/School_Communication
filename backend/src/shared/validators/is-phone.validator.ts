import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsPhoneNumberString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumberString',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid 10-to-15 digit mobile number`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          const cleaned = value.replace(/[\s\-+]/g, '');
          return /^\d{10,15}$/.test(cleaned);
        },
      },
    });
  };
}
