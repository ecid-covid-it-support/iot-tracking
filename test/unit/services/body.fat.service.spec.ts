import HttpStatus from 'http-status-codes'
import { assert } from 'chai'
import { IQuery } from '../../../src/application/port/query.interface'
import { Query } from '../../../src/infrastructure/repository/query/query'
import { Strings } from '../../../src/utils/strings'
import { MultiStatus } from '../../../src/application/domain/model/multi.status'
import { BodyFat } from '../../../src/application/domain/model/body.fat'
import { BodyFatMock } from '../../mocks/body.fat.mock'
import { IBodyFatRepository } from '../../../src/application/port/body.fat.repository.interface'
import { BodyFatRepositoryMock } from '../../mocks/body.fat.repository.mock'
import { IBodyFatService } from '../../../src/application/port/body.fat.service.interface'
import { BodyFatService } from '../../../src/application/service/body.fat.service'
import { IWeightRepository } from '../../../src/application/port/weight.repository.interface'
import { WeightRepositoryMock } from '../../mocks/weight.repository.mock'
import { MeasurementType } from '../../../src/application/domain/model/measurement'

describe('Services: BodyFatService', () => {
    const bodyFat: BodyFat = new BodyFatMock()

    // For GET route
    const bodyFatArr: Array<BodyFatMock> = new Array<BodyFatMock>()
    for (let i = 0; i < 3; i++) {
        bodyFatArr.push(new BodyFatMock())
    }

    /**
     * For POST route with multiple BodyFat objects
     */
        // Array with correct BodyFat objects
    const correctBodyFatArr: Array<BodyFat> = new Array<BodyFatMock>()
    for (let i = 0; i < 3; i++) {
        correctBodyFatArr.push(new BodyFatMock())
    }

    // Incorrect BodyFat objects
    let incorrectBodyFat: BodyFat = new BodyFat()           // Without all required fields
    incorrectBodyFat.type = undefined
    incorrectBodyFat.unit = undefined

    const incorrectBodyFat2: BodyFat = new BodyFatMock()    // child_id is invalid
    incorrectBodyFat2.child_id = '5a62be07de34500146d9c5442'

    // Array with correct and incorrect BodyFat objects
    const mixedBodyFatArr: Array<BodyFat> = new Array<BodyFatMock>()
    mixedBodyFatArr.push(new BodyFatMock())
    mixedBodyFatArr.push(incorrectBodyFat)

    // Array with only incorrect BodyFat objects
    const incorrectBodyFatArr: Array<BodyFat> = new Array<BodyFatMock>()
    incorrectBodyFatArr.push(incorrectBodyFat)
    incorrectBodyFatArr.push(incorrectBodyFat2)

    const bodyFatRepo: IBodyFatRepository = new BodyFatRepositoryMock()
    const weightRepo: IWeightRepository = new WeightRepositoryMock()

    const bodyFatService: IBodyFatService = new BodyFatService(bodyFatRepo, weightRepo)

    /**
     * Method: add(bodyFat: BodyFat | Array<BodyFat>) with BodyFat argument)
     */
    describe('add(bodyFat: BodyFat | Array<BodyFat>) with BodyFat argument)', () => {
        context('when the BodyFat is correct, it still does not exist in the repository', () => {
            it('should return the BodyFat that was added', () => {
                return bodyFatService.add(bodyFat)
                    .then((result: BodyFat | Array<BodyFat>) => {
                        result = result as BodyFat
                        assert.propertyVal(result, 'id', bodyFat.id)
                        assert.propertyVal(result, 'type', bodyFat.type)
                        assert.propertyVal(result, 'timestamp', bodyFat.timestamp)
                        assert.propertyVal(result, 'value', bodyFat.value)
                        assert.propertyVal(result, 'unit', bodyFat.unit)
                        assert.propertyVal(result, 'child_id', bodyFat.child_id)
                    })
            })
        })

        context('when the BodyFat is correct but is not successfully created in the database', () => {
            it('should return undefined', () => {
                bodyFat.id = '507f1f77bcf86cd799439013'             // Make return undefined in create method

                return bodyFatService.add(bodyFat)
                    .then((result) => {
                        assert.equal(result, undefined)
                    })
            })
        })

        context('when the BodyFat is correct but already exists in the repository', () => {
            it('should throw a ConflictException', () => {
                bodyFat.id = '507f1f77bcf86cd799439011'         // Make mock return true in checkExist method

                return bodyFatService.add(bodyFat)
                    .catch(error => {
                        assert.propertyVal(error, 'message', Strings.BODY_FAT.ALREADY_REGISTERED)
                    })
            })
        })

        context('when the BodyFat is incorrect (missing all fields)', () => {
            it('should throw a ValidationException', () => {
                return bodyFatService.add(incorrectBodyFat)
                    .catch(err => {
                        assert.propertyVal(err, 'message', Strings.ERROR_MESSAGE.REQUIRED_FIELDS)
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.REQUIRED_FIELDS_DESC
                            .replace('{0}', 'type, timestamp, value, unit, child_id'))
                    })
            })
        })

        context('when the BodyFat is incorrect (child_id is invalid)', () => {
            it('should throw a ValidationException', () => {
                incorrectBodyFat = new BodyFatMock()
                incorrectBodyFat.child_id = '5a62be07de34500146d9c5442'           // Make child_id invalid

                return bodyFatService.add(incorrectBodyFat)
                    .catch(err => {
                        assert.propertyVal(err, 'message', Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })

        context('when the BodyFat is incorrect (type is invalid)', () => {
            it('should throw a ValidationException', () => {
                incorrectBodyFat.child_id = '5a62be07de34500146d9c544'           // Make child_id valid
                incorrectBodyFat.type = 'invalidType'

                return bodyFatService.add(incorrectBodyFat)
                    .catch(err => {
                        assert.propertyVal(err, 'message',
                            'The type of measurement provided "invalidtype" is not supported...')
                        assert.propertyVal(err, 'description',
                            'The allowed types are: temperature, humidity, pm1, pm2.5, pm10, body_fat, weight.')
                    })
            })
        })

    })

    /**
     * Method "add(bodyFat: BodyFat | Array<BodyFat>)" with Array<BodyFat> argument
     */
    describe('add(bodyFat: BodyFat | Array<BodyFat>) with Array<BodyFat> argument', () => {
        context('when all the BodyFat objects of the array are correct, they still do not exist in the repository', () => {
            it('should create each BodyFat and return a response of type MultiStatus<BodyFat> with the description ' +
                'of success in sending each one of them', () => {
                return bodyFatService.add(correctBodyFatArr)
                    .then((result: BodyFat | MultiStatus<BodyFat>) => {
                        result = result as MultiStatus<BodyFat>

                        for (let i = 0; i < result.success.length; i++) {
                            assert.propertyVal(result.success[i], 'code', HttpStatus.CREATED)
                            assert.propertyVal(result.success[i].item, 'id', correctBodyFatArr[i].id)
                            assert.propertyVal(result.success[i].item, 'type', correctBodyFatArr[i].type)
                            assert.propertyVal(result.success[i].item, 'timestamp', correctBodyFatArr[i].timestamp)
                            assert.propertyVal(result.success[i].item, 'value', correctBodyFatArr[i].value)
                            assert.propertyVal(result.success[i].item, 'unit', correctBodyFatArr[i].unit)
                            assert.propertyVal(result.success[i].item, 'child_id', correctBodyFatArr[i].child_id)
                        }

                        assert.isEmpty(result.error)
                    })
            })
        })

        context('when all the BodyFat objects of the array are correct but already exists in the repository', () => {
            it('should return a response of type MultiStatus<BodyFat> with the description of conflict in each one of ' +
                'them', () => {
                correctBodyFatArr.forEach(elem => {
                    elem.id = '507f1f77bcf86cd799439011'
                })

                return bodyFatService.add(correctBodyFatArr)
                    .then((result: BodyFat | MultiStatus<BodyFat>) => {
                        result = result as MultiStatus<BodyFat>

                        for (let i = 0; i < result.error.length; i++) {
                            assert.propertyVal(result.error[i], 'code', HttpStatus.CONFLICT)
                            assert.propertyVal(result.error[i], 'message', Strings.BODY_FAT.ALREADY_REGISTERED)
                            assert.propertyVal(result.error[i].item, 'id', correctBodyFatArr[i].id)
                            assert.propertyVal(result.error[i].item, 'type', correctBodyFatArr[i].type)
                            assert.propertyVal(result.error[i].item, 'timestamp', correctBodyFatArr[i].timestamp)
                            assert.propertyVal(result.error[i].item, 'value', correctBodyFatArr[i].value)
                            assert.propertyVal(result.error[i].item, 'unit', correctBodyFatArr[i].unit)
                            assert.propertyVal(result.error[i].item, 'child_id', correctBodyFatArr[i].child_id)
                        }

                        assert.isEmpty(result.success)
                    })
            })
        })

        context('when there are correct and incorrect BodyFat objects in the array', () => {
            it('should create each correct BodyFat and return a response of type MultiStatus<BodyFat> with the description of success ' +
                'and error in each one of them', () => {
                return bodyFatService.add(mixedBodyFatArr)
                    .then((result: BodyFat | MultiStatus<BodyFat>) => {
                        result = result as MultiStatus<BodyFat>

                        assert.propertyVal(result.success[0], 'code', HttpStatus.CREATED)
                        assert.propertyVal(result.success[0].item, 'id', mixedBodyFatArr[0].id)
                        assert.propertyVal(result.success[0].item, 'type', mixedBodyFatArr[0].type)
                        assert.propertyVal(result.success[0].item, 'timestamp', mixedBodyFatArr[0].timestamp)
                        assert.propertyVal(result.success[0].item, 'value', mixedBodyFatArr[0].value)
                        assert.propertyVal(result.success[0].item, 'unit', mixedBodyFatArr[0].unit)
                        assert.propertyVal(result.success[0].item, 'child_id', mixedBodyFatArr[0].child_id)

                        assert.propertyVal(result.error[0], 'code', HttpStatus.BAD_REQUEST)
                        assert.propertyVal(result.error[0], 'message', Strings.ERROR_MESSAGE.REQUIRED_FIELDS)
                        assert.propertyVal(result.error[0], 'description', Strings.ERROR_MESSAGE.REQUIRED_FIELDS_DESC
                            .replace('{0}', 'type, timestamp, value, unit, child_id'))
                    })
            })
        })

        context('when all the BodyFat objects of the array are incorrect', () => {
            it('should return a response of type MultiStatus<BodyFat> with the description of error in each one of them', () => {
                return bodyFatService.add(incorrectBodyFatArr)
                    .then((result: BodyFat | MultiStatus<BodyFat>) => {
                        result = result as MultiStatus<BodyFat>

                        assert.propertyVal(result.error[0], 'message',
                            Strings.ERROR_MESSAGE.REQUIRED_FIELDS)
                        assert.propertyVal(result.error[0], 'description',
                            Strings.ERROR_MESSAGE.REQUIRED_FIELDS_DESC
                                .replace('{0}', 'type, timestamp, value, unit, child_id'))
                        assert.propertyVal(result.error[1], 'message',
                            Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                        assert.propertyVal(result.error[1], 'description',
                            Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)

                        for (let i = 0; i < result.error.length; i++) {
                            assert.propertyVal(result.error[i], 'code', HttpStatus.BAD_REQUEST)
                            assert.propertyVal(result.error[i].item, 'id', incorrectBodyFatArr[i].id)
                            assert.propertyVal(result.error[i].item, 'type', incorrectBodyFatArr[i].type)
                            assert.propertyVal(result.error[i].item, 'timestamp', incorrectBodyFatArr[i].timestamp)
                            assert.propertyVal(result.error[i].item, 'value', incorrectBodyFatArr[i].value)
                            assert.propertyVal(result.error[i].item, 'unit', incorrectBodyFatArr[i].unit)
                            assert.propertyVal(result.error[i].item, 'child_id', incorrectBodyFatArr[i].child_id)
                        }

                        assert.isEmpty(result.success)
                    })
            })
        })
    })

    /**
     * Method: getByIdAndChild(bodyFatId: string, childId: string, query: IQuery)
     */
    describe('getByIdAndChild(bodyFatId: string, childId: string, query: IQuery)', () => {
        context('when there is BodyFat with the received parameters', () => {
            it('should return the BodyFat that was found', () => {
                bodyFat.id = '507f1f77bcf86cd799439011'            // Make mock return a BodyFat
                const query: IQuery = new Query()
                query.filters = {
                    _id: bodyFat.id,
                    child_id: bodyFat.child_id
                }

                return bodyFatService.getByIdAndChild(bodyFat.id!, bodyFat.child_id!, query)
                    .then(result => {
                        assert(result, 'result must not be undefined')
                    })
            })
        })

        context('when there is no BodyFat with the received parameters', () => {
            it('should return undefined', () => {
                bodyFat.id = '5a62be07de34500146d9c544'            // Make mock return undefined
                const query: IQuery = new Query()
                query.filters = {
                    _id: bodyFat.id,
                    child_id: bodyFat.child_id
                }

                return bodyFatService.getByIdAndChild(bodyFat.id!, bodyFat.child_id!, query)
                    .then(result => {
                        assert.isUndefined(result)
                    })
            })
        })

        context('when the BodyFat id is invalid', () => {
            it('should throw a ValidationException', () => {
                bodyFat.id = '5a62be07de34500146d9c5442'       // Make bodyFat id invalid
                const query: IQuery = new Query()
                query.filters = {
                    _id: bodyFat.id,
                    child_id: bodyFat.child_id
                }

                try {
                    return bodyFatService.getByIdAndChild(bodyFat.id!, bodyFat.child_id!, query)
                } catch (err) {
                    assert.propertyVal(err, 'message', Strings.BODY_FAT.PARAM_ID_NOT_VALID_FORMAT)
                    assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                }
            })
        })

        context('when the bodyFat child_id is invalid', () => {
            it('should throw a ValidationException', () => {
                bodyFat.id = '5a62be07de34500146d9c544'            // Make bodyFat id valid again
                bodyFat.child_id = '5a62be07de34500146d9c5442'     // Make child_id invalid
                const query: IQuery = new Query()
                query.filters = {
                    _id: bodyFat.id,
                    child_id: bodyFat.child_id
                }

                try {
                    return bodyFatService.getByIdAndChild(bodyFat.id!, bodyFat.child_id, query)
                } catch (err) {
                    assert.propertyVal(err, 'message', Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                    assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                }
            })
        })
    })

    /**
     * Method: getAllByChild(childId: string, query: IQuery)
     */
    describe('getAllByChild(childId: string, query: IQuery)', () => {
        context('when there is at least one BodyFat associated with that childId', () => {
            it('should return a BodyFat array', () => {
                bodyFat.child_id = '5a62be07de34500146d9c544'      // Make child_id valid again
                const query: IQuery = new Query()
                query.filters = {
                    child_id: bodyFat.child_id,
                    type: MeasurementType.BODY_FAT
                }

                return bodyFatService.getAllByChild(bodyFat.child_id, query)
                    .then(result => {
                        assert(result, 'result must not be undefined')
                    })
            })
        })

        context('when there is no BodyFat with the received parameters', () => {
            it('should return an empty array', () => {
                bodyFat.child_id = '507f1f77bcf86cd799439011'        // Make mock return an empty array
                const query: IQuery = new Query()
                query.filters = {
                    child_id: bodyFat.child_id,
                    type: MeasurementType.BODY_FAT
                }

                return bodyFatService.getAllByChild(bodyFat.child_id, query)
                    .then(result => {
                        assert.isArray(result)
                        assert.isEmpty(result)
                    })
            })
        })

        context('when the BodyFat child_id is invalid', () => {
            it('should throw a ValidationException', () => {
                bodyFat.child_id = '5a62be07de34500146d9c5442'     // Make child_id invalid
                const query: IQuery = new Query()
                query.filters = {
                    child_id: bodyFat.child_id,
                    type: MeasurementType.BODY_FAT
                }

                try {
                    return bodyFatService.getAllByChild(bodyFat.child_id, query)
                } catch (err) {
                    assert.propertyVal(err, 'message', Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                    assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                }
            })
        })
    })

    /**
     * Method: removeByChild(bodyFatId: string, childId: string)
     */
    describe('removeByChild(bodyFatId: string, childId: string)', () => {
        context('when there is BodyFat with the received parameters', () => {
            it('should return true', () => {
                bodyFat.child_id = '5a62be07de34500146d9c544'     // Make child_id valid again
                bodyFat.id = '507f1f77bcf86cd799439011'            // Make mock return true

                weightRepo.disassociateBodyFat(bodyFat.id)   // Disassociate BodyFat from Weight object
                    .then(result => {
                        assert.equal(result, true)
                    })

                return bodyFatService.removeByChild(bodyFat.id, bodyFat.child_id)
                    .then(result => {
                        assert.equal(result, true)
                    })
            })
        })

        context('when there is no BodyFat with the received parameters', () => {
            it('should return false', () => {
                bodyFat.id = '5a62be07de34500146d9c544'            // Make mock return false

                return bodyFatService.removeByChild(bodyFat.id, bodyFat.child_id!)
                    .then(result => {
                        assert.equal(result, false)
                    })
            })
        })

        context('when the BodyFat is incorrect (child_id is invalid)', () => {
            it('should throw a ValidationException', () => {
                incorrectBodyFat.child_id = '5a62be07de34500146d9c5442'     // Make child_id invalid

                return bodyFatService.removeByChild(incorrectBodyFat.id!, incorrectBodyFat.child_id)
                    .catch(err => {
                        assert.propertyVal(err, 'message', Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })

        context('when the BodyFat is incorrect (id is invalid)', () => {
            it('should throw a ValidationException', () => {
                incorrectBodyFat = new BodyFatMock()
                incorrectBodyFat.id = '5a62be07de34500146d9c5442'       // Make bodyFat id invalid

                return bodyFatService.removeByChild(incorrectBodyFat.id!, incorrectBodyFat.child_id!)
                    .catch(err => {
                        assert.propertyVal(err, 'message', Strings.BODY_FAT.PARAM_ID_NOT_VALID_FORMAT)
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })
    })

    describe('countBodyFats(childId: string)', () => {
        context('when there is at least one body fat associated with the child received', () => {
            it('should return how many body fats are associated with such child in the database', () => {
                return bodyFatService.countByChild(bodyFat.child_id!)
                    .then(res => {
                        assert.equal(res, 1)
                    })
            })
        })
    })
})
