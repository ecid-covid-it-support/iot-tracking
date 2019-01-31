import { ValidationException } from '../exception/validation.exception'
import { SleepPattern } from '../model/sleep.pattern'
import { SleepPatternDataSetValidator } from './sleep.pattern.dataset.validator'

export class SleepPatternValidator {
    public static validate(sleepPattern: SleepPattern): void | ValidationException {
        const fields: Array<string> = []
        const message: string = 'Pattern are not in a format that is supported...'

        // validate null
        if (!sleepPattern.data_set) fields.push('data_set')
        else if (!sleepPattern.data_set.length) {
            throw new ValidationException(message, 'The data_set collection must not be empty!')
        }
        else sleepPattern.data_set.forEach(item => SleepPatternDataSetValidator.validate(item))

        if (fields.length > 0) {
            throw new ValidationException(message,
                'Validation of the standard of sleep failed: '.concat(fields.join(', ')).concat(' is required!'))
        }
    }
}