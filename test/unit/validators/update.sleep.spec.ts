import { assert } from 'chai'
import { Strings } from '../../../src/utils/strings'
import { Sleep } from '../../../src/application/domain/model/sleep'
import { SleepPattern, SleepPatternType } from '../../../src/application/domain/model/sleep.pattern'
import { SleepPatternDataSet } from '../../../src/application/domain/model/sleep.pattern.data.set'
import { UpdateSleepValidator } from '../../../src/application/domain/validator/update.sleep.validator'

const sleep: Sleep = new Sleep()
sleep.id = '5a62be07de34500146d9c544'
sleep.start_time = new Date('2018-08-18T01:40:30Z')
sleep.end_time = new Date('2018-08-18T09:52:30Z')
sleep.duration = 29520000
sleep.child_id = '5a62be07de34500146d9c544'
/**
 * Create SleepPattern for sleep
 */
sleep.pattern = new SleepPattern()
const dataSet: Array<SleepPatternDataSet> = []

const dataSetItem: SleepPatternDataSet = new SleepPatternDataSet()
dataSetItem.start_time = new Date(sleep.start_time)
dataSetItem.name = SleepPatternType.RESTLESS
dataSetItem.duration = Math.floor(Math.random() * 5 + 1) * 60000 // 1-5min milliseconds

const dataSetItem2: SleepPatternDataSet = new SleepPatternDataSet()
dataSetItem2.start_time = new Date('2018-08-18T01:45:30Z')
dataSetItem2.name = SleepPatternType.AWAKE
dataSetItem2.duration = Math.floor(Math.random() * 3 + 1) * 60000 // 1-3min in milliseconds

const dataSetItem3: SleepPatternDataSet = new SleepPatternDataSet()
dataSetItem3.start_time = new Date('2018-08-18T02:45:30Z')
dataSetItem3.name = SleepPatternType.ASLEEP
dataSetItem3.duration = Math.floor(Math.random() * 120 + 1) * 60000 // 1-180min in milliseconds

dataSet.push(dataSetItem)
dataSet.push(dataSetItem2)
dataSet.push(dataSetItem3)

sleep.pattern.data_set = dataSet

describe('Validators: UpdateSleepValidator', () => {
    /**
     * Activity parameters
     */
    context('when the sleep has all the required parameters, and that they have valid values', () => {
        it('should return undefined representing the success of the validation', () => {
            const result = UpdateSleepValidator.validate(sleep)
            assert.equal(result, undefined)
        })
    })

    context('When the sleep has an invalid child_id', () => {
        it('should throw a ValidationException', () => {
            sleep.child_id = '5a62be07de34500146d9c5442'
            try {
                UpdateSleepValidator.validate(sleep)
            } catch (err) {
                assert.property(err, 'message')
                assert.property(err, 'description')
                assert.equal(err.message, 'Parameter {child_id} is not in valid format!')
                assert.equal(err.description, Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
            }
            sleep.child_id = '5a62be07de34500146d9c544'
        })
    })

    context('When the sleep has an invalid id', () => {
        it('should throw a ValidationException', () => {
            sleep.id = '5a62be07de34500146d9c5442'
            try {
                UpdateSleepValidator.validate(sleep)
            } catch (err) {
                assert.property(err, 'message')
                assert.property(err, 'description')
                assert.equal(err.message, 'Parameter {sleep_id} is not in valid format!')
                assert.equal(err.description, Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
            }
            sleep.id = '5a62be07de34500146d9c544'
        })
    })

    context('When the sleep has a negative duration', () => {
        it('should throw a ValidationException', () => {
            sleep.duration = -29520000
            try {
                UpdateSleepValidator.validate(sleep)
            } catch (err) {
                assert.property(err, 'message')
                assert.property(err, 'description')
                assert.equal(err.message, 'Duration field is invalid...')
                assert.equal(err.description, 'Sleep validation failed: '.concat(Strings.ERROR_MESSAGE.NEGATIVE_PARAMETER))
            }
            sleep.duration = 29520000
        })
    })
    /**
     * Sleep parameters
     */
    context('when the sleep does not have all the required parameters (in this case missing data_set of pattern)', () => {
        it('should throw a ValidationException', () => {
            sleep.pattern = new SleepPattern()
            try {
                UpdateSleepValidator.validate(sleep)
            } catch (err) {
                assert.property(err, 'message')
                assert.property(err, 'description')
                assert.equal(err.message, 'Pattern are not in a format that is supported...')
                assert.equal(err.description, 'Validation of the standard of sleep failed: data_set is required!')
            }
        })
    })

    context('when the sleep has an empty data_set array in your pattern', () => {
        it('should throw a ValidationException', () => {
            sleep.pattern!.data_set = new Array<SleepPatternDataSet>()
            try {
                UpdateSleepValidator.validate(sleep)
            } catch (err) {
                assert.property(err, 'message')
                assert.property(err, 'description')
                assert.equal(err.message, 'Dataset are not in a format that is supported!')
                assert.equal(err.description, 'The data_set collection must not be empty!')
            }
        })
    })

    context('when the sleep has an invalid data_set array in your pattern (in this case missing start_time from some data_set item)',
        () => {
        it('should throw a ValidationException', () => {
            const dataSetItemTest: SleepPatternDataSet = new SleepPatternDataSet()
            dataSetItemTest.name = SleepPatternType.RESTLESS
            dataSetItemTest.duration = Math.floor(Math.random() * 5 + 1) * 60000 // 1-5min milliseconds

            sleep.pattern!.data_set = [dataSetItemTest]
            try {
                UpdateSleepValidator.validate(sleep)
            } catch (err) {
                assert.property(err, 'message')
                assert.property(err, 'description')
                assert.equal(err.message, 'Dataset are not in a format that is supported!')
                assert.equal(err.description, 'Validation of the sleep pattern dataset failed: data_set start_time is required!')
            }
        })
    })

    context('when the sleep has an invalid data_set array in your pattern (in this case missing all elements from some data_set item)',
        () => {
        it('should throw a ValidationException', () => {
            const dataSetItemTest: SleepPatternDataSet = new SleepPatternDataSet()

            sleep.pattern!.data_set = [dataSetItemTest]
            try {
                UpdateSleepValidator.validate(sleep)
            } catch (err) {
                assert.property(err, 'message')
                assert.property(err, 'description')
                assert.equal(err.message, 'Dataset are not in a format that is supported!')
                assert.equal(err.description, 'Validation of the sleep pattern dataset failed: data_set start_time, ' +
                    'data_set name, data_set duration is required!')
            }
        })
    })

    context('when the sleep has an invalid data_set array in your pattern (in this case the duration of some data_set item is negative)',
        () => {
        it('should throw a ValidationException', () => {
            const dataSetItemTest: SleepPatternDataSet = new SleepPatternDataSet()
            dataSetItemTest.start_time = new Date(sleep.start_time!)
            dataSetItemTest.name = SleepPatternType.RESTLESS
            dataSetItemTest.duration = -60000
            sleep.pattern!.data_set = [dataSetItemTest]
            try {
                UpdateSleepValidator.validate(sleep)
            } catch (err) {
                assert.property(err, 'message')
                assert.property(err, 'description')
                assert.equal(err.message, 'Some (or several) duration field of sleep pattern is invalid...')
                assert.equal(err.description, 'Sleep Pattern validation failed: The value provided has a negative value!')
            }
        })
    })
})