import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsPhoneNumberIndonesiaConstraint
    implements ValidatorConstraintInterface
{
    validate(phoneNumber: string) {
        if (!phoneNumber || phoneNumber === '') {
            return true; // Allow empty/null values for optional fields
        }
        const regex = /^62[2-9][0-9]{7,12}$/; // Must start with 62 and have 8-13 digits
        return typeof phoneNumber === 'string' && regex.test(phoneNumber);
    }

    defaultMessage() {
        return 'Phone number must be a valid Indonesian number starting with 62 followed by 8-13 digits.';
    }
}

export function IsPhoneNumberIndonesia(validationOptions?: ValidationOptions) {
    return function (object: Record<string, any>, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsPhoneNumberIndonesiaConstraint,
        });
    };
}
