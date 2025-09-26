import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const isNumeric = (value: string): boolean => {
  if (value.length === 0) {
    return false;
  }
  for (const char of value) {
    if (char < '0' || char > '9') {
      return false;
    }
  }
  return true;
};

@ValidatorConstraint({ name: 'decimalPrecision', async: false })
class DecimalPrecisionConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (value === null || value === undefined || value === '') {
      return true;
    }

    if (typeof value !== 'string') {
      return false;
    }

    if (value.startsWith('-')) {
      return false;
    }

    const [maxIntegerDigits, maxFractionDigits] = args.constraints as [
      number,
      number,
    ];

    const segments = value.split('.');
    if (segments.length > 2) {
      return false;
    }

    const [integerPart, fractionPart] = segments as [
      string,
      string | undefined,
    ];

    if (!isNumeric(integerPart) || integerPart.length > maxIntegerDigits) {
      return false;
    }

    if (fractionPart === undefined) {
      return true;
    }

    if (!isNumeric(fractionPart)) {
      return false;
    }

    return fractionPart.length > 0 && fractionPart.length <= maxFractionDigits;
  }

  defaultMessage(args: ValidationArguments): string {
    const [maxIntegerDigits, maxFractionDigits] = args.constraints as [
      number,
      number,
    ];
    return `${args.property} must be a non-negative decimal string with up to ${maxIntegerDigits} digits before the decimal point and up to ${maxFractionDigits} digits after it.`;
  }
}

export const DecimalPrecision = (
  maxIntegerDigits: number,
  maxFractionDigits: number,
  validationOptions?: ValidationOptions,
) =>
  function applyDecimalPrecision(object: object, propertyName: string): void {
    registerDecorator({
      name: 'decimalPrecision',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [maxIntegerDigits, maxFractionDigits],
      validator: DecimalPrecisionConstraint,
    });
  };
