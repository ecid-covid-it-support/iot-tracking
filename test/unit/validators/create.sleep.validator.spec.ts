import { assert } from 'chai'
import { Strings } from '../../../src/utils/strings'
import { CreateSleepValidator } from '../../../src/application/domain/validator/create.sleep.validator'
import { SleepPattern } from '../../../src/application/domain/model/sleep.pattern'
import { SleepPatternDataSet } from '../../../src/application/domain/model/sleep.pattern.data.set'
import { SleepMock } from '../../mocks/sleep.mock'
import { ObjectID } from 'bson'
import { Sleep, SleepType } from '../../../src/application/domain/model/sleep'

const sleep: SleepMock = new SleepMock()
const data_set_aux = sleep.pattern!.data_set

describe('Validators: CreateSleepValidator', () => {
    describe('validate(sleep: Sleep)', () => {
        /**
         * Activity parameters
         */
        context('when the sleep has all the required parameters, and that they have valid values', () => {
            it('should return undefined representing the success of the validation', () => {
                const result = CreateSleepValidator.validate(sleep)
                assert.equal(result, undefined)
            })
        })

        context('when the sleep does not have all the required parameters (in this case missing start_time)', () => {
            it('should throw a ValidationException', () => {
                sleep.start_time = undefined
                try {
                    CreateSleepValidator.validate(sleep)
                } catch (err) {
                    assert.equal(err.message, 'Required fields were not provided...')
                    assert.equal(err.description, 'Activity validation failed: start_time is required!')
                }
            })
        })

        context('when the sleep does not have any of the required parameters', () => {
            it('should throw a ValidationException', () => {
                sleep.end_time = undefined
                sleep.duration = undefined
                sleep.child_id = ''
                try {
                    CreateSleepValidator.validate(sleep)
                } catch (err) {
                    assert.equal(err.message, 'Required fields were not provided...')
                    assert.equal(err.description, 'Activity validation failed: start_time, end_time, duration, ' +
                        'child_id is required!')
                }
            })
        })

        context('When the sleep has an invalid parameter (start_time with a date newer than end_time)', () => {
            it('should throw a ValidationException', () => {
                sleep.start_time = new Date('2018-08-19T01:40:30Z')
                sleep.end_time = new Date('2018-08-18T09:52:30Z')
                sleep.duration = 29520000
                sleep.child_id = '5a62be07de34500146d9c544'
                try {
                    CreateSleepValidator.validate(sleep)
                } catch (err) {
                    assert.equal(err.message, 'Date field is invalid...')
                    assert.equal(err.description, 'Date validation failed: The end_time parameter can not contain an older date ' +
                        'than that the start_time parameter!')
                }
            })
        })

        context('When the sleep has a duration that is incompatible with the start_time and end_time parameters', () => {
            it('should throw a ValidationException', () => {
                sleep.start_time = new Date('2018-08-18T01:40:30Z')
                sleep.duration = 295200000
                try {
                    CreateSleepValidator.validate(sleep)
                } catch (err) {
                    assert.equal(err.message, 'Duration field is invalid...')
                    assert.equal(err.description, 'Duration validation failed: Activity duration value does not match values ' +
                        'passed in start_time and end_time parameters!')
                }
            })
        })

        context('When the sleep has a negative duration', () => {
            it('should throw a ValidationException', () => {
                sleep.duration = -29520000
                try {
                    CreateSleepValidator.validate(sleep)
                } catch (err) {
                    assert.equal(err.message, 'Duration field is invalid...')
                    assert.equal(err.description, 'Activity validation failed: '.concat(Strings.ERROR_MESSAGE.NEGATIVE_PARAMETER))
                }
                sleep.duration = 29520000
            })
        })

        context('When the activity has an invalid child_id', () => {
            it('should throw a ValidationException', () => {
                sleep.child_id = '5a62be07de34500146d9c5442'
                try {
                    CreateSleepValidator.validate(sleep)
                } catch (err) {
                    assert.equal(err.message, 'Parameter {child_id} is not in valid format!')
                    assert.equal(err.description, Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                }
                sleep.child_id = '5a62be07de34500146d9c544'
            })
        })

        /**
         * Sleep parameters
         */
        context('when the sleep does not have all the required parameters (in this case missing pattern)', () => {
            it('should throw a ValidationException', () => {
                sleep.pattern = undefined
                try {
                    CreateSleepValidator.validate(sleep)
                } catch (err) {
                    assert.equal(err.message, 'Required fields were not provided...')
                    assert.equal(err.description, 'Sleep validation failed: pattern is required!')
                }
            })
        })

        context('when the sleep does not have all the required parameters (in this case missing type and pattern of sleep)', () => {
            it('should throw a ValidationException', () => {
                const sleepJSON: any = {
                    id: new ObjectID(),
                    start_time: sleep.start_time,
                    end_time: sleep.end_time,
                    duration: sleep.duration,
                    pattern: undefined,
                    type: '',
                    child_id: new ObjectID()
                }
                const invalidSleep = new Sleep().fromJSON(sleepJSON)
                try {
                    CreateSleepValidator.validate(invalidSleep)
                } catch (err) {
                    assert.equal(err.message, 'Required fields were not provided...')
                    assert.equal(err.description, 'Sleep validation failed: type, pattern is required!')
                }
            })
        })

        context('when the sleep has an invalid type', () => {
            it('should throw a ValidationException', () => {
                const sleepJSON: any = {
                    id: new ObjectID(),
                    start_time: sleep.start_time,
                    end_time: sleep.end_time,
                    duration: sleep.duration,
                    pattern: sleep.pattern,
                    type: 'classics',
                    child_id: new ObjectID()
                }
                const invalidSleep = new Sleep().fromJSON(sleepJSON)

                try {
                    CreateSleepValidator.validate(invalidSleep)
                } catch (err) {
                    assert.equal(err.message, 'The type provided "classics" is not supported...')
                    assert.equal(err.description, 'The allowed Sleep Pattern types are: classic, stages.')
                }
            })
        })

        context('when the sleep does not have all the required parameters (in this case missing data_set of pattern)', () => {
            it('should throw a ValidationException', () => {
                sleep.pattern = new SleepPattern()
                try {
                    CreateSleepValidator.validate(sleep)
                } catch (err) {
                    assert.equal(err.message, 'Pattern are not in a format that is supported...')
                    assert.equal(err.description, 'Validation of the standard of sleep failed: data_set is required!')
                }
            })
        })

        context('when the sleep has an empty data_set array in your pattern', () => {
            it('should throw a ValidationException', () => {
                sleep.pattern!.data_set = new Array<SleepPatternDataSet>()
                try {
                    CreateSleepValidator.validate(sleep)
                } catch (err) {
                    assert.equal(err.message, 'Dataset are not in a format that is supported!')
                    assert.equal(err.description, 'The data_set collection must not be empty!')
                }
                sleep.pattern!.data_set = data_set_aux
            })
        })

        context('when the sleep has an invalid data_set array in your pattern (in this case missing start_time from some data_set item)',
            () => {
                it('should throw a ValidationException', () => {
                    const dataSetItemTest: SleepPatternDataSet = new SleepPatternDataSet()
                    dataSetItemTest.name = sleep.pattern!.data_set[0].name
                    dataSetItemTest.duration = Math.floor(Math.random() * 5 + 1) * 60000 // 1-5min milliseconds

                    sleep.pattern!.data_set = [dataSetItemTest]
                    try {
                        CreateSleepValidator.validate(sleep)
                    } catch (err) {
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
                        CreateSleepValidator.validate(sleep)
                    } catch (err) {
                        assert.equal(err.message, 'Dataset are not in a format that is supported!')
                        assert.equal(err.description, 'Validation of the sleep pattern dataset failed: data_set start_time, ' +
                            'data_set name, data_set duration is required!')
                    }
                })
        })

        context('when the sleep has an invalid data_set array in your pattern (in this case the duration of some ' +
            'data_set item is negative)',
            () => {
                it('should throw a ValidationException', () => {
                    const dataSetItemTest: SleepPatternDataSet = new SleepPatternDataSet()
                    dataSetItemTest.start_time = new Date(sleep.start_time!)
                    dataSetItemTest.name = sleep.pattern!.data_set[0].name
                    dataSetItemTest.duration = -60000
                    sleep.pattern!.data_set = [dataSetItemTest]
                    try {
                        CreateSleepValidator.validate(sleep)
                    } catch (err) {
                        assert.equal(err.message, 'Some (or several) duration field of sleep pattern is invalid...')
                        assert.equal(err.description, 'Sleep Pattern dataset validation failed: The value provided has a negative value!')
                    }
                    dataSetItemTest.duration = 60000
                })
        })

        context('when the sleep pattern data set array has an invalid item (invalid name)', () => {
            it('should throw a ValidationException', () => {
                const dataSetItemJSON: any = {
                    start_time : new Date('2018-08-18T01:30:30Z'),
                    name : 'restlesss',
                    duration : Math.floor(Math.random() * 5 + 1) * 60000 // 1-5min
                }
                sleep.pattern!.data_set = [new SleepPatternDataSet().fromJSON(dataSetItemJSON)]
                try {
                    CreateSleepValidator.validate(sleep)
                } catch (err) {
                    assert.equal(err.message, 'The sleep pattern name provided "restlesss" is not supported...')
                    if (sleep.type === SleepType.CLASSIC)
                        assert.equal(err.description, 'The names of the allowed patterns are: asleep, restless, awake.')
                    else
                        assert.equal(err.description, 'The names of the allowed patterns are: deep, light, rem, awake.')
                }
            })
        })

        context('when the sleep pattern data set array has an invalid item (invalid name) and the sleep type is "stages"', () => {
            it('should throw a ValidationException', () => {
                const sleepJSON: any = {
                    id: new ObjectID(),
                    start_time: sleep.start_time,
                    end_time: sleep.end_time,
                    duration: sleep.duration,
                    pattern: new SleepPattern(),
                    type: SleepType.STAGES,
                    child_id: new ObjectID()
                }
                const invalidSleep = new Sleep().fromJSON(sleepJSON)
                const dataSetItemJSON: any = {
                    start_time : new Date('2018-08-18T01:30:30Z'),
                    name : 'deeps',
                    duration : Math.floor(Math.random() * 5 + 1) * 60000 // 1-5min
                }
                invalidSleep.pattern!.data_set = new Array<SleepPatternDataSet>()
                invalidSleep.pattern!.data_set[0] = new SleepPatternDataSet().fromJSON(dataSetItemJSON)
                try {
                    CreateSleepValidator.validate(invalidSleep)
                } catch (err) {
                    assert.equal(err.message, 'The sleep pattern name provided "deeps" is not supported...')
                    assert.equal(err.description, 'The names of the allowed patterns are: deep, light, rem, awake.')
                }
            })
        })
    })
})
