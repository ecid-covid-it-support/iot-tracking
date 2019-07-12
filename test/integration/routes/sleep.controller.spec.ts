import HttpStatus from 'http-status-codes'
import { Container } from 'inversify'
import { DI } from '../../../src/di/di'
import { Identifier } from '../../../src/di/identifiers'
import { App } from '../../../src/app'
import { BackgroundService } from '../../../src/background/background.service'
import { expect } from 'chai'
import { SleepMock } from '../../mocks/sleep.mock'
import { Sleep, SleepType } from '../../../src/application/domain/model/sleep'
import { Strings } from '../../../src/utils/strings'
import { SleepPattern } from '../../../src/application/domain/model/sleep.pattern'
import { SleepRepoModel } from '../../../src/infrastructure/database/schema/sleep.schema'
import { SleepEntityMapper } from '../../../src/infrastructure/entity/mapper/sleep.entity.mapper'
import { ObjectID } from 'bson'
import { PhasesPatternType, SleepPatternDataSet } from '../../../src/application/domain/model/sleep.pattern.data.set'

const container: Container = DI.getInstance().getContainer()
const backgroundServices: BackgroundService = container.get(Identifier.BACKGROUND_SERVICE)
const app: App = container.get(Identifier.APP)
const request = require('supertest')(app.getExpress())

describe('Routes: users.children.sleep', () => {
    const defaultSleep: Sleep = new SleepMock()
    const otherSleep: Sleep = new SleepMock()
    otherSleep.child_id = '5a62be07de34500146d9c542'

    /**
     * Mock objects for POST route with multiple sleep objects
     */
    // Array with correct sleep objects
    const correctSleepArr: Array<Sleep> = new Array<SleepMock>()
    for (let i = 0; i < 3; i++) {
        correctSleepArr.push(new SleepMock())
    }

    // Incorrect sleep objects
    const incorrectSleepJSON: any = {
        id: new ObjectID(),
        start_time: defaultSleep.start_time!.toISOString(),
        end_time: defaultSleep.end_time!.toISOString(),
        duration: defaultSleep.duration,
        pattern: undefined,
        type: '',
        child_id: defaultSleep.child_id
    }

    // Incorrect sleep objects
    const incorrectSleep1: Sleep = new Sleep()        // Without all required fields

    const incorrectSleep2: Sleep = new Sleep().fromJSON(incorrectSleepJSON)    // Without Sleep fields

    const incorrectSleep3: Sleep = new SleepMock()    // start_time with a date newer than end_time
    incorrectSleep3.start_time = new Date('2018-12-15T12:52:59Z')
    incorrectSleep3.end_time = new Date('2018-12-14T13:12:37Z')

    // The duration is incompatible with the start_time and end_time parameters
    const incorrectSleep4: Sleep = new SleepMock()
    incorrectSleep4.duration = 11780000

    const incorrectSleep5: Sleep = new SleepMock()    // The duration is negative
    incorrectSleep5.duration = -11780000

    incorrectSleepJSON.type = 'classics'              // Sleep type is invalid
    const incorrectSleep6: Sleep = new Sleep().fromJSON(incorrectSleepJSON)

    const incorrectSleep7: Sleep = new SleepMock()    // Missing data_set of pattern
    incorrectSleep7.pattern = new SleepPattern()

    const incorrectSleep8: Sleep = new SleepMock()    // The pattern has an empty data_set array
    incorrectSleep8.pattern!.data_set = new Array<SleepPatternDataSet>()

    const incorrectSleep9: Sleep = new SleepMock()    // Missing fields of some item from the data_set array of pattern
    const dataSetItemSleep9: SleepPatternDataSet = new SleepPatternDataSet()
    incorrectSleep9.pattern!.data_set = [dataSetItemSleep9]

    const incorrectSleep10: Sleep = new SleepMock()    // There is a negative duration on some item from the data_set array of pattern
    const dataSetItemSleep10: SleepPatternDataSet = new SleepPatternDataSet()
    dataSetItemSleep10.start_time = new Date(defaultSleep.start_time!)
    dataSetItemSleep10.name = incorrectSleep10.pattern!.data_set[0].name
    dataSetItemSleep10.duration = -(Math.floor(Math.random() * 5 + 1) * 60000)
    incorrectSleep10.pattern!.data_set = [dataSetItemSleep10]

    const incorrectSleep11: Sleep = new SleepMock()     // The sleep pattern data set array has an invalid item with an invalid name
    const wrongDataSetItemJSON: any = {
        start_time : new Date('2018-08-18T01:30:30Z'),
        name : 'restlesss',
        duration : Math.floor(Math.random() * 5 + 1) * 60000 // 1-5min
    }
    incorrectSleep11.pattern!.data_set = [new SleepPatternDataSet().fromJSON(wrongDataSetItemJSON)]

    // The sleep pattern data set array has an invalid item with an invalid name and the sleep type is "stages"
    const sleepJSON: any = {
        id: new ObjectID(),
        start_time: defaultSleep.start_time!.toISOString(),
        end_time: defaultSleep.end_time!.toISOString(),
        duration: defaultSleep.duration,
        pattern: new SleepPattern(),
        type: SleepType.STAGES,
        child_id: defaultSleep.child_id
    }
    const incorrectSleep12: Sleep = new Sleep().fromJSON(sleepJSON)
    const wrongDataSetItem12JSON: any = {
        start_time : new Date('2018-08-18T01:30:30Z'),
        name : 'deeps',
        duration : Math.floor(Math.random() * 5 + 1) * 60000 // 1-5min
    }
    incorrectSleep12.pattern!.data_set = new Array<SleepPatternDataSet>()
    incorrectSleep12.pattern!.data_set[0] = new SleepPatternDataSet().fromJSON(wrongDataSetItem12JSON)

    // Array with correct and incorrect sleep objects
    const mixedSleepArr: Array<Sleep> = new Array<SleepMock>()
    mixedSleepArr.push(new SleepMock())
    mixedSleepArr.push(incorrectSleep1)

    // Array with only incorrect sleep objects
    const incorrectSleepArr: Array<Sleep> = new Array<SleepMock>()
    incorrectSleepArr.push(incorrectSleep1)
    incorrectSleepArr.push(incorrectSleep2)
    incorrectSleepArr.push(incorrectSleep3)
    incorrectSleepArr.push(incorrectSleep4)
    incorrectSleepArr.push(incorrectSleep5)
    incorrectSleepArr.push(incorrectSleep6)
    incorrectSleepArr.push(incorrectSleep7)
    incorrectSleepArr.push(incorrectSleep8)
    incorrectSleepArr.push(incorrectSleep9)
    incorrectSleepArr.push(incorrectSleep10)
    incorrectSleepArr.push(incorrectSleep11)
    incorrectSleepArr.push(incorrectSleep12)

    // Start services
    before(async () => {
        try {
            deleteAllSleep()
            await backgroundServices.startServices()
        } catch (err) {
            throw new Error('Failure on users.children.sleep routes test: ' + err.message)
        }
    })

    // Delete all database sleep objects
    after(async () => {
        try {
            deleteAllSleep()
        } catch (err) {
            throw new Error('Failure on users.children.sleep routes test: ' + err.message)
        }
    })
    /**
     * POST route with only one Sleep in the body
     */
    describe('POST /v1/users/children/:child_id/sleep with only one Sleep in the body', () => {
        context('when posting a new Sleep with success', () => {
            it('should return status code 201 and the saved Sleep', () => {
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: defaultSleep.pattern,
                    type: defaultSleep.type
                }

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(201)
                    .then(res => {
                        defaultSleep.id = res.body.id
                        expect(res.body.id).to.eql(defaultSleep.id)
                        expect(res.body.start_time).to.eql(defaultSleep.start_time!.toISOString())
                        expect(res.body.end_time).to.eql(defaultSleep.end_time!.toISOString())
                        expect(res.body.duration).to.eql(defaultSleep.duration)
                        expect(res.body.pattern.data_set)
                            .to.eql(defaultSleep.pattern!.data_set.map((elem: SleepPatternDataSet) => elem.toJSON()))
                        expect(res.body.type).to.eql(defaultSleep.type)
                        expect(res.body.child_id).to.eql(defaultSleep.child_id)
                    })
            })
        })

        context('when a duplicate error occurs', () => {
            it('should return status code 409 and an info message about duplicate items', () => {
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: defaultSleep.pattern,
                    type: defaultSleep.type
                }

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(409)
                    .then(err => {
                        expect(err.body.code).to.eql(409)
                        expect(err.body.message).to.eql('Sleep is already registered...')
                    })
            })
        })

        context('when a validation error occurs (missing all required fields)', () => {
            it('should return status code 400 and info message about the missing fields', () => {
                const body = {}

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Required fields were not provided...')
                        expect(err.body.description).to.eql('Activity validation failed: start_time, end_time, duration is required!')
                    })
            })
        })

        context('when a validation error occurs (missing required field of sleep)', () => {
            it('should return status code 400 and info message about the missing fields', () => {
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration
                }

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Required fields were not provided...')
                        expect(err.body.description).to.eql('Sleep validation failed: type, pattern is required!')
                    })
            })
        })

        context('when a validation error occurs (start_time with a date newer than end_time)', () => {
            it('should return status code 400 and info message about the invalid date', () => {
                const body = {
                    start_time: new Date(2020),
                    end_time: new Date(2019),
                    duration: defaultSleep.duration,
                    pattern: defaultSleep.pattern,
                    type: defaultSleep.type
                }

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Date field is invalid...')
                        expect(err.body.description).to.eql('Date validation failed: The end_time parameter can not ' +
                            'contain a older date than that the start_time parameter!')
                    })
            })
        })

        context('when a validation error occurs (the duration is incompatible with the start_time and end_time parameters)', () => {
            it('should return status code 400 and info message about the invalid duration', () => {
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: Math.floor(Math.random() * 180 + 1) * 60000,
                    pattern: defaultSleep.pattern,
                    type: defaultSleep.type
                }

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Duration field is invalid...')
                        expect(err.body.description).to.eql('Duration validation failed: Activity duration value does ' +
                            'not match values passed in start_time and end_time parameters!')
                    })
            })
        })

        context('when a validation error occurs (the duration is negative)', () => {
            it('should return status code 400 and info message about the invalid duration', () => {
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: -(defaultSleep.duration!),
                    pattern: defaultSleep.pattern,
                    type: defaultSleep.type
                }

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Duration field is invalid...')
                        expect(err.body.description).to.eql('Activity validation failed: The value provided has a negative value!')
                    })
            })
        })

        context('when a validation error occurs (child_id is invalid)', () => {
            it('should return status code 400 and info message about the invalid child_id', () => {
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: defaultSleep.pattern,
                    type: defaultSleep.type
                }

                return request
                    .post(`/v1/users/children/123/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql(Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                        expect(err.body.description).to.eql(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })

        context('when a validation error occurs (sleep type is invalid)', () => {
            it('should return status code 400 and info message about the invalid child_id', () => {
                const body = {
                    start_time: incorrectSleep6.start_time,
                    end_time: incorrectSleep6.end_time,
                    duration: incorrectSleep6.duration,
                    pattern: incorrectSleep6.pattern,
                    type: incorrectSleep6.type
                }

                return request
                    .post(`/v1/users/children/${incorrectSleep6.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('The type provided "classics" is not supported...')
                        expect(err.body.description).to.eql('The allowed Sleep Pattern types are: classic, stages.')
                    })
            })
        })

        context('when a validation error occurs (missing data_set of pattern)', () => {
            it('should return status code 400 and info message about the invalid pattern', () => {
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: new SleepPattern(),
                    type: defaultSleep.type
                }

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Pattern are not in a format that is supported...')
                        expect(err.body.description).to.eql('Validation of the standard of sleep failed: data_set is required!')
                    })
            })
        })

        context('when a validation error occurs (the pattern has an empty data_set array)', () => {
            it('should return status code 400 and info message about the invalid data_set array of pattern', () => {
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: {
                        data_set: []
                    },
                    type: defaultSleep.type
                }

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Dataset are not in a format that is supported!')
                        expect(err.body.description).to.eql('The data_set collection must not be empty!')
                    })
            })
        })

        context('when a validation error occurs (missing fields of some item from the data_set array of pattern)', () => {
            it('should return status code 400 and info message about the invalid data_set array of pattern', () => {
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: {
                        data_set: [
                            {}
                        ]
                    },
                    type: defaultSleep.type
                }

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Dataset are not in a format that is supported!')
                        expect(err.body.description).to.eql('Validation of the sleep pattern dataset failed: data_set ' +
                            'start_time, data_set name, data_set duration is required!')
                    })
            })
        })

        context('when a validation error occurs (there is a negative duration on some item from the data_set array of pattern)', () => {
            it('should return status code 400 and info message about the invalid data_set array of pattern', () => {
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: {
                        data_set: [
                            {
                                start_time: '2018-08-18T01:40:30.00Z',
                                name: defaultSleep.pattern!.data_set[0].name,
                                duration: -(Math.floor(Math.random() * 5 + 1) * 60000)
                            }
                        ]
                    },
                    type: defaultSleep.type
                }

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Some (or several) duration field of sleep pattern is invalid...')
                        expect(err.body.description).to.eql('Sleep Pattern dataset validation failed: The value provided ' +
                            'has a negative value!')
                    })
            })
        })

        context('when a validation error occurs (The sleep pattern data set array has an invalid item with an invalid name)', () => {
            it('should return status code 400 and info message about the invalid data_set array of pattern', () => {
                const body = {
                    start_time: incorrectSleep11.start_time,
                    end_time: incorrectSleep11.end_time,
                    duration: incorrectSleep11.duration,
                    pattern: incorrectSleep11.pattern,
                    type: incorrectSleep11.type
                }

                return request
                    .post(`/v1/users/children/${incorrectSleep11.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('The sleep pattern name provided "restlesss" is not supported...')
                        if (incorrectSleep11.type === SleepType.CLASSIC)
                            expect(err.body.description).to.eql('The names of the allowed patterns are: asleep, restless, awake.')
                        else expect(err.body.description).to.eql('The names of the allowed patterns are: deep, light, rem, wake.')
                    })
            })
        })

        context('when a validation error occurs (The sleep pattern data set array has an invalid item with an invalid name ' +
            'and the sleep type is "stages")', () => {
            it('should return status code 400 and info message about the invalid data_set array of pattern', () => {
                const body = {
                    start_time: incorrectSleep12.start_time,
                    end_time: incorrectSleep12.end_time,
                    duration: incorrectSleep12.duration,
                    pattern: incorrectSleep12.pattern,
                    type: incorrectSleep12.type
                }

                return request
                    .post(`/v1/users/children/${incorrectSleep12.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('The sleep pattern name provided "deeps" is not supported...')
                        expect(err.body.description).to.eql('The names of the allowed patterns are: deep, light, rem, wake.')
                    })
            })
        })
    })
    /**
     * POST route with a Sleep array in the body
     */
    describe('POST /v1/users/children/:child_id/sleep with a Sleep array in the body', () => {
        context('when all the sleep objects are correct and still do not exist in the repository', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 201, create each Sleep and return a response of type MultiStatus<Sleep> ' +
                'with the description of success in sending each one of them', () => {
                const body: any = []

                correctSleepArr.forEach(sleep => {
                    const bodyElem = {
                        start_time: sleep.start_time,
                        end_time: sleep.end_time,
                        duration: sleep.duration,
                        pattern: sleep.pattern,
                        type: sleep.type
                    }
                    body.push(bodyElem)
                })

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(201)
                    .then(res => {
                        for (let i = 0; i < res.body.success.length; i++) {
                            expect(res.body.success[i].code).to.eql(HttpStatus.CREATED)
                            expect(res.body.success[i].item.start_time).to.eql(correctSleepArr[i].start_time!.toISOString())
                            expect(res.body.success[i].item.end_time).to.eql(correctSleepArr[i].end_time!.toISOString())
                            expect(res.body.success[i].item.duration).to.eql(correctSleepArr[i].duration)
                            expect(res.body.success[i].item.pattern.data_set)
                                .to.eql(correctSleepArr[i].pattern!.data_set.map((elem: SleepPatternDataSet) => elem.toJSON()))
                            expect(res.body.success[i].item.type).to.eql(correctSleepArr[i].type)
                            expect(res.body.success[i].item.child_id).to.eql(correctSleepArr[i].child_id)
                        }

                        expect(res.body.error.length).to.eql(0)
                    })
            })
        })

        context('when all the sleep objects are correct but already exists in the repository', () => {
            it('should return status code 201 and return a response of type MultiStatus<Sleep> with the ' +
                'description of conflict in sending each one of them', () => {
                const body: any = []

                correctSleepArr.forEach(sleep => {
                    const bodyElem = {
                        start_time: sleep.start_time,
                        end_time: sleep.end_time,
                        duration: sleep.duration,
                        pattern: sleep.pattern,
                        type: sleep.type
                    }
                    body.push(bodyElem)
                })

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(201)
                    .then(res => {
                        for (let i = 0; i < res.body.error.length; i++) {
                            expect(res.body.error[i].code).to.eql(HttpStatus.CONFLICT)
                            expect(res.body.error[i].message).to.eql('Sleep is already registered...')
                            expect(res.body.error[i].item.start_time).to.eql(correctSleepArr[i].start_time!.toISOString())
                            expect(res.body.error[i].item.end_time).to.eql(correctSleepArr[i].end_time!.toISOString())
                            expect(res.body.error[i].item.duration).to.eql(correctSleepArr[i].duration)
                            expect(res.body.error[i].item.pattern.data_set)
                                .to.eql(correctSleepArr[i].pattern!.data_set.map((elem: SleepPatternDataSet) => elem.toJSON()))
                            expect(res.body.error[i].item.type).to.eql(correctSleepArr[i].type)
                            expect(res.body.error[i].item.child_id).to.eql(correctSleepArr[i].child_id)
                        }

                        expect(res.body.success.length).to.eql(0)
                    })
            })
        })

        context('when there are correct and incorrect sleep objects in the body', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 201 and return a response of type MultiStatus<Sleep> with the ' +
                'description of success and error in each one of them', () => {
                const body: any = []

                mixedSleepArr.forEach(sleep => {
                    const bodyElem = {
                        start_time: sleep.start_time,
                        end_time: sleep.end_time,
                        duration: sleep.duration,
                        pattern: sleep.pattern,
                        type: sleep.type
                    }
                    body.push(bodyElem)
                })

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(201)
                    .then(res => {
                        // Success item
                        expect(res.body.success[0].code).to.eql(HttpStatus.CREATED)
                        expect(res.body.success[0].item.start_time).to.eql(mixedSleepArr[0].start_time!.toISOString())
                        expect(res.body.success[0].item.end_time).to.eql(mixedSleepArr[0].end_time!.toISOString())
                        expect(res.body.success[0].item.duration).to.eql(mixedSleepArr[0].duration)
                        expect(res.body.success[0].item.pattern.data_set)
                            .to.eql(mixedSleepArr[0].pattern!.data_set.map((elem: SleepPatternDataSet) => elem.toJSON()))
                        expect(res.body.success[0].item.type).to.eql(mixedSleepArr[0].type)
                        expect(res.body.success[0].item.child_id).to.eql(mixedSleepArr[0].child_id)

                        // Error item
                        expect(res.body.error[0].code).to.eql(HttpStatus.BAD_REQUEST)
                        expect(res.body.error[0].message).to.eql('Required fields were not provided...')
                        expect(res.body.error[0].description).to.eql('Activity validation failed: start_time, end_time, ' +
                            'duration is required!')
                    })
            })
        })

        context('when all the sleep objects are incorrect', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 201 and return a response of type MultiStatus<Sleep> with the ' +
                'description of error in each one of them', () => {
                const body: any = []

                incorrectSleepArr.forEach(sleep => {
                    const bodyElem = {
                        start_time: sleep.start_time,
                        end_time: sleep.end_time,
                        duration: sleep.duration,
                        pattern: sleep.pattern,
                        type: sleep.type
                    }
                    body.push(bodyElem)
                })

                return request
                    .post(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(201)
                    .then(res => {
                        expect(res.body.error[0].message).to.eql('Required fields were not provided...')
                        expect(res.body.error[0].description).to.eql('Activity validation failed: start_time, end_time, ' +
                            'duration is required!')
                        expect(res.body.error[1].message).to.eql('Required fields were not provided...')
                        expect(res.body.error[1].description).to.eql('Sleep validation failed: type, pattern is required!')
                        expect(res.body.error[2].message).to.eql('Date field is invalid...')
                        expect(res.body.error[2].description).to.eql('Date validation failed: The end_time parameter can not contain ' +
                            'a older date than that the start_time parameter!')
                        expect(res.body.error[3].message).to.eql('Duration field is invalid...')
                        expect(res.body.error[3].description).to.eql('Duration validation failed: Activity duration value does not ' +
                            'match values passed in start_time and end_time parameters!')
                        expect(res.body.error[4].message).to.eql('Duration field is invalid...')
                        expect(res.body.error[4].description).to.eql('Activity validation failed: The value provided has a negative value!')
                        expect(res.body.error[5].message).to.eql('The type provided "classics" is not supported...')
                        expect(res.body.error[5].description).to.eql('The allowed Sleep Pattern types are: classic, stages.')
                        expect(res.body.error[6].message).to.eql('Pattern are not in a format that is supported...')
                        expect(res.body.error[6].description).to.eql('Validation of the standard of sleep failed: data_set is required!')
                        expect(res.body.error[7].message).to.eql('Dataset are not in a format that is supported!')
                        expect(res.body.error[7].description).to.eql('The data_set collection must not be empty!')
                        expect(res.body.error[8].message).to.eql('Dataset are not in a format that is supported!')
                        expect(res.body.error[8].description).to.eql('Validation of the sleep pattern dataset failed: ' +
                            'data_set start_time, data_set name, data_set duration is required!')
                        expect(res.body.error[9].message).to.eql('Some (or several) duration field of sleep pattern is invalid...')
                        expect(res.body.error[9].description).to.eql('Sleep Pattern dataset validation failed: The value provided ' +
                            'has a negative value!')
                        expect(res.body.error[10].message).to.eql('The sleep pattern name provided "restlesss" is not supported...')
                        if (incorrectSleep11.type === SleepType.CLASSIC)
                            expect(res.body.error[10].description).to.eql('The names of the allowed patterns are: asleep, restless, awake.')
                        else
                            expect(res.body.error[10].description).to.eql('The names of the allowed patterns are: deep, light, rem, wake.')
                        expect(res.body.error[11].message).to.eql('The sleep pattern name provided "deeps" is not supported...')
                        expect(res.body.error[11].description).to.eql('The names of the allowed patterns are: deep, light, rem, wake.')

                        for (let i = 0; i < res.body.error.length; i++) {
                            expect(res.body.error[i].code).to.eql(HttpStatus.BAD_REQUEST)
                            if (res.body.error[i].item.start_time)
                                expect(res.body.error[i].item.start_time).to.eql(incorrectSleepArr[i].start_time!.toISOString())
                            if (res.body.error[i].item.end_time)
                                expect(res.body.error[i].item.end_time).to.eql(incorrectSleepArr[i].end_time!.toISOString())
                            expect(res.body.error[i].item.duration).to.eql(incorrectSleepArr[i].duration)
                            if (i !== 0 && i !== 1 && i !== 5 && i !== 6 && i !== 8) {
                                expect(res.body.error[i].item.pattern.data_set)
                                    .to.eql(incorrectSleepArr[i].pattern!.data_set.map(
                                        (elem: SleepPatternDataSet) => elem.toJSON()))
                            }
                            if (res.body.error[i].item.type)
                                expect(res.body.error[i].item.type).to.eql(incorrectSleepArr[i].type)
                            if (i !== 0)
                                expect(res.body.error[i].item.child_id).to.eql(incorrectSleepArr[i].child_id)
                        }

                        expect(res.body.success.length).to.eql(0)
                    })
            })
        })
    })
    /**
     * Route GET all
     */
    describe('GET /v1/users/children/sleep', () => {
        const defaultPattern = [
            {
                start_time: defaultSleep.start_time,
                name: PhasesPatternType.RESTLESS,
                duration: Math.floor(Math.random() * 5 + 1) * 60000
            },
            {
                start_time: defaultSleep.start_time,
                name: PhasesPatternType.ASLEEP,
                duration: Math.floor(Math.random() * 120 + 1) * 60000
            },
            {
                start_time: defaultSleep.start_time,
                name: PhasesPatternType.AWAKE,
                duration: Math.floor(Math.random() * 3 + 1) * 60000
            }
        ]

        context('when get all sleep of the database successfully', () => {
            it('should return status code 200 and a list of all sleep found', async () => {
                await createSleep({
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: defaultSleep.pattern!.data_set,
                    type: defaultSleep.type,
                    child_id: defaultSleep.child_id
                })

                return request
                    .get('/v1/users/children/sleep')
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        defaultSleep.id = res.body[0].id
                        expect(res.body).is.an.instanceOf(Array)
                        expect(res.body.length).to.not.eql(0)
                        // Check for the existence of properties only in the first element of the array
                        // because there is a guarantee that there will be at least one object, which was
                        // created in the case of POST route success test
                        expect(res.body[0].id).to.eql(defaultSleep.id)
                        expect(res.body[0].start_time).to.eql(defaultSleep.start_time!.toISOString())
                        expect(res.body[0].end_time).to.eql(defaultSleep.end_time!.toISOString())
                        expect(res.body[0].duration).to.eql(defaultSleep.duration)
                        expect(res.body[0].pattern.data_set)
                            .to.eql(defaultSleep.pattern!.data_set.map((elem: SleepPatternDataSet) => elem.toJSON()))
                        expect(res.body[0].type).to.eql(defaultSleep.type)
                        expect(res.body[0].child_id).to.eql(defaultSleep.child_id)
                    })
            })
        })

        context('when there are no sleep in the database', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 200 and an empty list', async () => {
                return request
                    .get('/v1/users/children/sleep')
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.an.instanceOf(Array)
                        expect(res.body.length).to.eql(0)
                    })
            })
        })
        /**
         * query-strings-parser library test
         */
        context('when get sleep using the "query-strings-parser" library', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 200 and the result as needed in the query', async () => {
                try {
                    await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: defaultPattern,
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })

                    await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: new ObjectID()
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                const url = `/v1/users/children/sleep?child_id=${defaultSleep.child_id}&fields=start_time,end_time,
                    duration,pattern,type,child_id&sort=child_id&page=1&limit=3`

                return request
                    .get(url)
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        defaultSleep.id = res.body[0].id
                        expect(res.body).is.an.instanceOf(Array)
                        expect(res.body.length).to.not.eql(0)
                        // Check for the existence of properties only in the first element of the array
                        // because there is a guarantee that there will be at least one object with the property
                        // 'climatized' = true (the only query filter)
                        expect(res.body[0].id).to.eql(defaultSleep.id)
                        expect(res.body[0].start_time).to.eql(defaultSleep.start_time!.toISOString())
                        expect(res.body[0].end_time).to.eql(defaultSleep.end_time!.toISOString())
                        expect(res.body[0].duration).to.eql(defaultSleep.duration)
                        // expect(res.body[0].pattern.data_set).to.eql(defaultPattern)
                        expect(res.body[0].type).to.eql(defaultSleep.type)
                        expect(res.body[0].child_id).to.eql(defaultSleep.child_id)
                    })
            })
        })

        context('when there is an attempt to get sleep using the "query-strings-parser" library but there is no sleep ' +
            'in the database', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 200 and an empty list', async () => {
                const url = `/v1/users/children/sleep?child_id=${defaultSleep.child_id}&fields=start_time,end_time,
                    duration,pattern,child_id&sort=child_id&page=1&limit=3`

                return request
                    .get(url)
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.an.instanceOf(Array)
                        expect(res.body.length).to.eql(0)
                    })
            })
        })
    })
    /**
     * Route GET all sleep by child
     */
    describe('GET /v1/users/children/:child_id/sleep', () => {
        context('when get all sleep of a specific child of the database successfully', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 200 and a list of all sleep of that specific child', async () => {
                try {
                    await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                return request
                    .get(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        defaultSleep.id = res.body[0].id
                        expect(res.body).is.an.instanceOf(Array)
                        expect(res.body.length).to.not.eql(0)
                        // Check for the existence of properties only in the first element of the array
                        // because there is a guarantee that there will be at least one object, which was
                        // created in the case of POST route success test
                        expect(res.body[0].id).to.eql(defaultSleep.id)
                        expect(res.body[0].start_time).to.eql(defaultSleep.start_time!.toISOString())
                        expect(res.body[0].end_time).to.eql(defaultSleep.end_time!.toISOString())
                        expect(res.body[0].duration).to.eql(defaultSleep.duration)
                        // expect(res.body[0].pattern).to.eql(defaultSleep.pattern)
                        expect(res.body[0].type).to.eql(defaultSleep.type)
                        expect(res.body[0].child_id).to.eql(defaultSleep.child_id)
                    })
            })
        })

        context('when there are no sleep associated with that specific child in the database', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 200 and an empty list', async () => {
                return request
                    .get(`/v1/users/children/${defaultSleep.child_id}/sleep`)
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.an.instanceOf(Array)
                        expect(res.body.length).to.eql(0)
                    })
            })
        })

        context('when the child_id is invalid', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and an info message about the invalid child_id', async () => {
                try {
                    await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                return request
                    .get(`/v1/users/children/123/sleep`)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql(Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                        expect(err.body.description).to.eql(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })
        /**
         * query-strings-parser library test
         */
        context('when get sleep using the "query-strings-parser" library', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 200 and the result as needed in the query', async () => {
                try {
                    await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                const url = `/v1/users/children/${defaultSleep.child_id}/sleep?child_id=${defaultSleep.child_id}&fields=start_time,end_time,
                    duration,pattern,type,child_id&sort=child_id&page=1&limit=3`

                return request
                    .get(url)
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        defaultSleep.id = res.body[0].id
                        expect(res.body).is.an.instanceOf(Array)
                        expect(res.body.length).to.not.eql(0)
                        // Check for the existence of properties only in the first element of the array
                        // because there is a guarantee that there will be at least one object with the property
                        // 'climatized' = true (the only query filter)
                        expect(res.body[0].id).to.eql(defaultSleep.id)
                        expect(res.body[0].start_time).to.eql(defaultSleep.start_time!.toISOString())
                        expect(res.body[0].end_time).to.eql(defaultSleep.end_time!.toISOString())
                        expect(res.body[0].duration).to.eql(defaultSleep.duration)
                        // expect(res.body[0].pattern).to.eql(defaultSleep.pattern)
                        expect(res.body[0].type).to.eql(defaultSleep.type)
                        expect(res.body[0].child_id).to.eql(defaultSleep.child_id)
                    })
            })
        })

        context('when there is an attempt to get sleep of a specific child using the "query-strings-parser" library but ' +
            'this sleep does not exist', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 200 and an empty list', async () => {
                const url = `/v1/users/children/${defaultSleep.child_id}/sleep?child_id=${defaultSleep.child_id}&fields=start_time,end_time,
                    duration,pattern,type,child_id&sort=child_id&page=1&limit=3`

                return request
                    .get(url)
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body).is.an.instanceOf(Array)
                        expect(res.body.length).to.eql(0)
                    })
            })
        })

        context('when there is an attempt to get sleep of a specific child using the "query-strings-parser" library ' +
            'but the child_id is invalid', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and an info message about the invalid child_id', async () => {
                try {
                    await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                const url = `/v1/users/children/123/sleep?child_id=${defaultSleep.child_id}&fields=start_time,end_time,
                    duration,pattern,type,child_id&sort=child_id&page=1&limit=3`

                return request
                    .get(url)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql(Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                        expect(err.body.description).to.eql(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })
    })
    /**
     * Route GET a sleep by child
     */
    describe('GET /v1/users/children/:child_id/sleep/:sleep_id', () => {
        context('when get a specific sleep of a child of the database successfully', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 200 and that specific sleep of that child', async () => {
                let result

                try {
                    result = await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                return request
                    .get(`/v1/users/children/${result.child_id}/sleep/${result.id}`)
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        // Check for the existence of properties only in the first element of the array
                        // because there is a guarantee that there will be at least one object, which was
                        // created in the case of POST route success test
                        expect(res.body.id).to.eql(result.id)
                        expect(res.body.start_time).to.eql(result.start_time!.toISOString())
                        expect(res.body.end_time).to.eql(result.end_time!.toISOString())
                        expect(res.body.duration).to.eql(result.duration)
                        // expect(res.body.pattern.data_set).to.eql(result.pattern.data_set)
                        expect(res.body.type).to.eql(result.type)
                        expect(res.body.child_id).to.eql(result.child_id.toString())
                    })
            })
        })

        context('when there is no that specific sleep associated with that child in the database', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 404 and an info message describing that sleep was not found', async () => {
                return request
                    .get(`/v1/users/children/${defaultSleep.child_id}/sleep/${defaultSleep.id}`)
                    .set('Content-Type', 'application/json')
                    .expect(404)
                    .then(err => {
                        expect(err.body.code).to.eql(404)
                        expect(err.body.message).to.eql('Sleep not found!')
                        expect(err.body.description).to.eql('Sleep not found or already removed. A new operation for ' +
                            'the same resource is not required!')
                    })
            })
        })

        context('when the child_id is invalid', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and an info message about the invalid child_id', async () => {
                let result

                try {
                    result = await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                return request
                    .get(`/v1/users/children/123/sleep/${result.id}`)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql(Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                        expect(err.body.description).to.eql(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })

        context('when the sleep id is invalid', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and an info message about the invalid sleep id', async () => {
                let result

                try {
                    result = await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                return request
                    .get(`/v1/users/children/${result.child_id}/sleep/123`)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql(Strings.SLEEP.PARAM_ID_NOT_VALID_FORMAT)
                        expect(err.body.description).to.eql(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })
        /**
         * query-strings-parser library test
         */
        context('when get a specific sleep of a child using the "query-strings-parser" library', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 200 and the result as needed in the query', async () => {
                let result

                try {
                    result = await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                const url = `/v1/users/children/${result.child_id}/sleep/${result.id}?child_id=${result.child_id}
                    &fields=start_time,end_time,duration,pattern,type,child_id&sort=child_id&page=1&limit=3`

                return request
                    .get(url)
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        expect(res.body.id).to.eql(result.id)
                        expect(res.body.start_time).to.eql(result.start_time!.toISOString())
                        expect(res.body.end_time).to.eql(result.end_time!.toISOString())
                        expect(res.body.duration).to.eql(result.duration)
                        // expect(res.body.pattern).to.eql(result.pattern)
                        expect(res.body.type).to.eql(result.type)
                        expect(res.body.child_id).to.eql(result.child_id.toString())
                    })
            })
        })

        context('when there is an attempt to get a specific sleep using the "query-strings-parser" library but this sleep ' +
            'does not exist', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 404 and an info message describing that sleep was not found', async () => {
                const url = `/v1/users/children/${defaultSleep.child_id}/sleep/${defaultSleep.id}?child_id=${defaultSleep.child_id}
                    &fields=start_time,end_time, duration,pattern,type,child_id&sort=child_id&page=1&limit=3`

                return request
                    .get(url)
                    .set('Content-Type', 'application/json')
                    .expect(404)
                    .then(err => {
                        expect(err.body.code).to.eql(404)
                        expect(err.body.message).to.eql('Sleep not found!')
                        expect(err.body.description).to.eql('Sleep not found or already removed. A new operation for ' +
                            'the same resource is not required!')
                    })
            })
        })

        context('when there is an attempt to get a specific sleep using the "query-strings-parser" library but the ' +
            'child_id is invalid', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and an info message about the invalid child_id', async () => {
                let result

                try {
                    result = await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                const url = `/v1/users/children/123/sleep/${result.id}?child_id=${result.child_id}&fields=start_time,end_time,
                    duration,pattern,type,child_id&sort=child_id&page=1&limit=3`

                return request
                    .get(url)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql(Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                        expect(err.body.description).to.eql(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })

        context('when there is an attempt to get a specific sleep using the "query-strings-parser" library but the ' +
            'sleep id is invalid', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and an info message about the invalid sleep id', async () => {
                let result

                try {
                    result = await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                const url = `/v1/users/children/${result.child_id}/sleep/123?child_id=${result.child_id}&fields=start_time,end_time,
                    duration,pattern,type,child_id&sort=child_id&page=1&limit=3`

                return request
                    .get(url)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql(Strings.SLEEP.PARAM_ID_NOT_VALID_FORMAT)
                        expect(err.body.description).to.eql(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })
    })
    /**
     * PATCH route
     */
    describe('PATCH /v1/users/children/:child_id/sleep/:sleep_id', () => {
        context('when this sleep exists in the database and is updated successfully', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 200 and the updated Sleep', async () => {
                let result

                try {
                    // Sleep to be updated
                    result = await createSleepToBeUpdated(defaultSleep)
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                // Sleep to update
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: defaultSleep.pattern,
                    type: defaultSleep.type
                }

                return request
                    .patch(`/v1/users/children/${result.child_id}/sleep/${result.id}`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .then(res => {
                        defaultSleep.id = res.body.id
                        expect(res.body.id).to.eql(defaultSleep.id)
                        expect(res.body.start_time).to.eql(defaultSleep.start_time!.toISOString())
                        expect(res.body.end_time).to.eql(defaultSleep.end_time!.toISOString())
                        expect(res.body.duration).to.eql(defaultSleep.duration)
                        // expect(res.body.pattern).to.eql(defaultSleep.pattern)
                        expect(res.body.type).to.eql(defaultSleep.type)
                        expect(res.body.child_id).to.eql(defaultSleep.child_id)
                    })
            })
        })

        context('when sleep does not exist in the database', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 404 and an info message about the error on the search', async () => {
                // Sleep to update
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: defaultSleep.pattern,
                    type: defaultSleep.type
                }

                return request
                    .patch(`/v1/users/children/${defaultSleep.child_id}/sleep/${defaultSleep.id}`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(404)
                    .then(err => {
                        expect(err.body.code).to.eql(404)
                        expect(err.body.message).to.eql('Sleep not found!')
                        expect(err.body.description).to.eql('Sleep not found or already removed. A new operation for ' +
                            'the same resource is not required!')
                    })
            })
        })

        context('when the child_id is invalid', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and an info message about the invalid child_id', async () => {
                let result

                try {
                    // Sleep to be updated
                    result = await createSleepToBeUpdated(defaultSleep)
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                // Sleep to update
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: defaultSleep.pattern,
                    type: defaultSleep.type
                }

                return request
                    .patch(`/v1/users/children/123/sleep/${result.id}`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql(Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                        expect(err.body.description).to.eql(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })

        context('when the sleep id is invalid', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and an info message about the invalid sleep id', async () => {
                let result

                try {
                    // Sleep to be updated
                    result = await createSleepToBeUpdated(defaultSleep)
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                // Sleep to update
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: defaultSleep.pattern,
                    type: defaultSleep.type
                }

                return request
                    .patch(`/v1/users/children/${result.child_id}/sleep/123`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql(Strings.SLEEP.PARAM_ID_NOT_VALID_FORMAT)
                        expect(err.body.description).to.eql(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })

        context('when a validation error occurs (the duration is negative)', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and info message about the invalid duration', async () => {
                let result

                try {
                    // Sleep to be updated
                    result = await createSleepToBeUpdated(defaultSleep)
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                // Sleep to update
                const body = {
                    duration: -(defaultSleep.duration!)
                }

                return request
                    .patch(`/v1/users/children/${result.child_id}/sleep/${result.id}`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Duration field is invalid...')
                        expect(err.body.description).to.eql('Sleep validation failed: The value provided has a negative value!')
                    })
            })
        })

        context('when a validation error occurs (missing data_set of pattern)', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and info message about the invalid pattern', async () => {
                let result

                try {
                    // Sleep to be updated
                    result = await createSleepToBeUpdated(defaultSleep)
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                // Sleep to update
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: new SleepPattern(),
                    type: defaultSleep.type
                }

                return request
                    .patch(`/v1/users/children/${result.child_id}/sleep/${result.id}`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Pattern are not in a format that is supported...')
                        expect(err.body.description).to.eql('Validation of the standard of sleep failed: data_set is required!')
                    })
            })
        })

        context('when a validation error occurs (the pattern has an empty data_set array)', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and info message about the invalid data_set array of pattern', async () => {
                let result

                try {
                    // Sleep to be updated
                    result = await createSleepToBeUpdated(defaultSleep)
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                // Sleep to update
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: {
                        data_set: []
                    },
                    type: defaultSleep.type
                }

                return request
                    .patch(`/v1/users/children/${result.child_id}/sleep/${result.id}`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Dataset are not in a format that is supported!')
                        expect(err.body.description).to.eql('The data_set collection must not be empty!')
                    })
            })
        })

        context('when a validation error occurs (missing fields of some item from the data_set array of pattern)', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and info message about the invalid data_set array of pattern', async () => {
                let result

                try {
                    // Sleep to be updated
                    result = await createSleepToBeUpdated(defaultSleep)
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                // Sleep to update
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: {
                        data_set: [
                            {}
                        ]
                    },
                    type: defaultSleep.type
                }

                return request
                    .patch(`/v1/users/children/${result.child_id}/sleep/${result.id}`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Dataset are not in a format that is supported!')
                        expect(err.body.description).to.eql('Validation of the sleep pattern dataset failed: data_set ' +
                            'start_time, data_set name, data_set duration is required!')
                    })
            })
        })

        context('when a validation error occurs (there is a negative duration on some item from the data_set array of pattern)', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and info message about the invalid data_set array of pattern', async () => {
                let result

                try {
                    // Sleep to be updated
                    result = await createSleepToBeUpdated(defaultSleep)
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                // Sleep to update
                const body = {
                    start_time: defaultSleep.start_time,
                    end_time: defaultSleep.end_time,
                    duration: defaultSleep.duration,
                    pattern: {
                        data_set: [
                            {
                                start_time: '2018-08-18T01:40:30.00Z',
                                name: 'restless',
                                duration: -(Math.floor(Math.random() * 5 + 1) * 60000)
                            }
                        ]
                    },
                    type: SleepType.CLASSIC
                }

                return request
                    .patch(`/v1/users/children/${result.child_id}/sleep/${result.id}`)
                    .send(body)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql('Some (or several) duration field of sleep pattern is invalid...')
                        expect(err.body.description).to.eql('Sleep Pattern dataset validation failed: The value provided ' +
                            'has a negative value!')
                    })
            })
        })
    })
    /**
     * DELETE route
     */
    describe('DELETE /v1/users/children/:child_id/sleep/:sleep_id', () => {
        context('when the sleep was deleted successfully', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 204 and no content for sleep', async () => {
                let result

                try {
                    result = await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                return request
                    .delete(`/v1/users/children/${result.child_id}/sleep/${result.id}`)
                    .set('Content-Type', 'application/json')
                    .expect(204)
                    .then(res => {
                        expect(res.body).to.eql({})
                    })
            })
        })

        context('when the sleep is not found', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 204 and no content for sleep', async () => {
                return request
                    .delete(`/v1/users/children/${defaultSleep.child_id}/sleep/${defaultSleep.id}`)
                    .set('Content-Type', 'application/json')
                    .expect(204)
                    .then(res => {
                        expect(res.body).to.eql({})
                    })
            })
        })

        context('when the child_id is invalid', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and an info message about the invalid child_id', async () => {
                let result

                try {
                    result = await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                return request
                    .delete(`/v1/users/children/123/sleep/${result.id}`)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql(Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                        expect(err.body.description).to.eql(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })

        context('when the sleep id is invalid', () => {
            before(() => {
                try {
                    deleteAllSleep()
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }
            })

            it('should return status code 400 and an info message about the invalid sleep id', async () => {
                let result

                try {
                    result = await createSleep({
                        start_time: defaultSleep.start_time,
                        end_time: defaultSleep.end_time,
                        duration: defaultSleep.duration,
                        pattern: [
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.RESTLESS,
                                duration: Math.floor(Math.random() * 5 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.ASLEEP,
                                duration: Math.floor(Math.random() * 120 + 1) * 60000
                            },
                            {
                                start_time: defaultSleep.start_time,
                                name: PhasesPatternType.AWAKE,
                                duration: Math.floor(Math.random() * 3 + 1) * 60000
                            }
                        ],
                        type: defaultSleep.type,
                        child_id: defaultSleep.child_id
                    })
                } catch (err) {
                    throw new Error('Failure on users.children.sleep routes test: ' + err.message)
                }

                return request
                    .delete(`/v1/users/children/${result.child_id}/sleep/123`)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .then(err => {
                        expect(err.body.code).to.eql(400)
                        expect(err.body.message).to.eql(Strings.SLEEP.PARAM_ID_NOT_VALID_FORMAT)
                        expect(err.body.description).to.eql(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })
    })
})
async function createSleep(item): Promise<any> {
    const sleepMapper: SleepEntityMapper = new SleepEntityMapper()
    const resultModel = sleepMapper.transform(item)
    const resultModelEntity = sleepMapper.transform(resultModel)
    return await Promise.resolve(SleepRepoModel.create(resultModelEntity))
}

async function createSleepToBeUpdated(defaultSleep: Sleep): Promise<any> {
    // Sleep to be updated
    const result =  createSleep({
        start_time: defaultSleep.start_time,
        end_time: defaultSleep.end_time,
        duration: defaultSleep.duration,
        pattern: [
            {
                start_time: defaultSleep.start_time,
                name: PhasesPatternType.RESTLESS,
                duration: Math.floor(Math.random() * 5 + 1) * 60000
            },
            {
                start_time: defaultSleep.start_time,
                name: PhasesPatternType.ASLEEP,
                duration: Math.floor(Math.random() * 120 + 1) * 60000
            },
            {
                start_time: defaultSleep.start_time,
                name: PhasesPatternType.AWAKE,
                duration: Math.floor(Math.random() * 3 + 1) * 60000
            }
        ],
        type: defaultSleep.type,
        child_id: defaultSleep.child_id
    })

    return await Promise.resolve(result)
}

function deleteAllSleep(): void {
    SleepRepoModel.deleteMany({}, err => {
        if (err) console.log('err: ' + err)
    })
}
