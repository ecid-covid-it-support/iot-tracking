import { ValidationException } from '../exception/validation.exception'
import { ActivityLevelType, PhysicalActivityLevel } from '../model/physical.activity.level'
import { Strings } from '../../../utils/strings'
import { IntegerPositiveValidator } from './integer.positive.validator'

export class PhysicalActivityLevelsValidator {
    public static validate(levels: Array<PhysicalActivityLevel>): void | ValidationException {
        const fields: Array<string> = []
        const levelsTypes = Object.values(ActivityLevelType)

        if (!levels.length) {
            throw new ValidationException(Strings.ERROR_MESSAGE.INVALID_FIELDS,
                `The levels array must have values for the following levels: ${levelsTypes.join(', ')}.`)
        }

        levels.forEach((level: PhysicalActivityLevel) => {
            // validate null
            if (level.name === undefined) fields.push('levels.name')
            else if (!levelsTypes.includes(level.name)) {
                throw new ValidationException(Strings.ERROR_MESSAGE.INVALID_FIELDS,
                    `The names of the allowed levels are: ${levelsTypes.join(', ')}.`)
            }
            if (level.duration === undefined) fields.push('levels.duration')
            else IntegerPositiveValidator.validate(level.duration, 'levels.duration')
        })

        if (levelsTypes.length !== levels.filter(item => levelsTypes.includes(item.name)).length) {
            throw new ValidationException(Strings.ERROR_MESSAGE.INVALID_FIELDS,
                `The levels array must have values for the following levels: ${levelsTypes.join(', ')}.`)
        }

        if (fields.length > 0) {
            throw new ValidationException(Strings.ERROR_MESSAGE.REQUIRED_FIELDS,
                Strings.ERROR_MESSAGE.REQUIRED_FIELDS_DESC.replace('{0}', fields.join(', ')))
        }
    }
}
