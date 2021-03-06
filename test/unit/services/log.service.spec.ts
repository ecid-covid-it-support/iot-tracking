import HttpStatus from 'http-status-codes'
import { assert } from 'chai'
import { LogMock } from '../../mocks/log.mock'
import { Log, LogType } from '../../../src/application/domain/model/log'
import { ILogRepository } from '../../../src/application/port/log.repository.interface'
import { LogRepositoryMock } from '../../mocks/log.repository.mock'
import { ILogService } from '../../../src/application/port/log.service.interface'
import { LogService } from '../../../src/application/service/log.service'
import { Strings } from '../../../src/utils/strings'

describe('Services: Log', () => {
    // Mock correct logs array
    const correctLogsArr: Array<Log> = new Array<Log>()
    for (let i = 0; i < 5; i++) {
        correctLogsArr.push(new LogMock())
    }

    // Mock correct and incorrect logs array
    const mixedLogsArr: Array<Log> = new Array<Log>()
    for (let i = 0; i < 4; i++) {
        mixedLogsArr.push(new LogMock())
    }

    // Incorrect log (invalid date)
    const incorrectLog = new Log('20199-03-08', 250, LogType.CALORIES, '5a62be07de34500146d9c544')
    incorrectLog.id = '507f1f77bcf86cd799439011'
    mixedLogsArr.push(incorrectLog)

    // Mock other incorrect log with invalid type
    const logJSON: any = {
        id: '507f1f77bcf86cd799439011',
        date: '2019-03-18',
        value: 1000,
        type: 'step',
        child_id: '5a62be07de34500146d9c544'
    }

    let otherIncorrectLog = new Log()
    otherIncorrectLog = otherIncorrectLog.fromJSON(logJSON)
    mixedLogsArr.push(new Log().fromJSON(logJSON))

    // Mock incorrect logs array
    const incorrectLogsArr: Array<Log> = new Array<Log>()
    incorrectLogsArr.push(incorrectLog)
    incorrectLogsArr.push(otherIncorrectLog)

    const logRepo: ILogRepository = new LogRepositoryMock()

    const logService: ILogService = new LogService(logRepo)

    /**
     * Method: addLogs(logs: Array<Log>)
     */
    describe('addLogs(logs: Array<Log>)', () => {
        context('when all the logs in the array are correct and it still does not exist in the repository', () => {
            it('should return a response of type MultiStatus<Log> with the description of success in sending each log', () => {
                return logService.addLogs(correctLogsArr)
                    .then(result => {
                        for (let i = 0; i < result.success.length; i++) {
                            assert.propertyVal(result.success[i], 'code', HttpStatus.CREATED)
                            assert.property(result.success[i].item, 'id')
                            assert.property(result.success[i].item, 'date')
                            assert.property(result.success[i].item, 'value')
                            assert.property(result.success[i].item, 'type')
                            assert.property(result.success[i].item, 'child_id')
                        }
                        assert.isEmpty(result.error)
                    })
            })
        })

        context('when all the logs in the array are correct and already exist in the repository', () => {
            it('should update the value of items in the repository and return a response of type MultiStatus<Log> with the description ' +
                'of success in sending each log', () => {
                correctLogsArr.forEach(elem => {
                    elem.date = '2018-03-10'
                })

                return logService.addLogs(correctLogsArr)
                    .then(result => {
                        for (let i = 0; i < result.success.length; i++) {
                            assert.propertyVal(result.success[i], 'code', HttpStatus.CREATED)
                            assert.property(result.success[i].item, 'id')
                            assert.property(result.success[i].item, 'date')
                            assert.property(result.success[i].item, 'value')
                            assert.property(result.success[i].item, 'type')
                            assert.property(result.success[i].item, 'child_id')
                        }
                        assert.isEmpty(result.error)
                    })
            })
        })

        context('when all the logs in the array are correct and some of them already exist in the repository', () => {
            it('should update the value of the existing items already in the repository, create the new ones, and return a ' +
                'response of type MultiStatus<Log> with the description of success in sending each log', () => {
                correctLogsArr.push(new LogMock(LogType.STEPS))

                return logService.addLogs(correctLogsArr)
                    .then(result => {
                        for (let i = 0; i < result.success.length; i++) {
                            assert.propertyVal(result.success[i], 'code', HttpStatus.CREATED)
                            assert.property(result.success[i].item, 'id')
                            assert.property(result.success[i].item, 'date')
                            assert.property(result.success[i].item, 'value')
                            assert.property(result.success[i].item, 'type')
                            assert.property(result.success[i].item, 'child_id')
                        }
                        assert.isEmpty(result.error)
                    })
            })
        })

        context('when all the logs in the array are incorrect', () => {
            it('should return a response of type MultiStatus<Log> with the description of error in sending each log', () => {
                correctLogsArr.push(new LogMock(LogType.STEPS))

                return logService.addLogs(incorrectLogsArr)
                    .then(result => {
                        assert.propertyVal(result.error[0], 'message', Strings.ERROR_MESSAGE.INVALID_DATE_FORMAT
                            .replace('{0}', '20199-03-08'))
                        assert.propertyVal(result.error[0], 'description',
                            Strings.ERROR_MESSAGE.INVALID_DATE_FORMAT_DESC)
                        assert.propertyVal(result.error[1], 'message',
                            Strings.ERROR_MESSAGE.INVALID_FIELDS)
                        assert.propertyVal(result.error[1], 'description',
                            'The names of the allowed types are: ' +
                            'steps, calories, active_minutes, lightly_active_minutes, sedentary_minutes.')

                        for (let i = 0; i < result.error.length; i++) {
                            assert.propertyVal(result.error[i], 'code', HttpStatus.BAD_REQUEST)
                            assert.propertyVal(result.error[i].item, 'id', incorrectLogsArr[i].id)
                            assert.propertyVal(result.error[i].item, 'date', incorrectLogsArr[i].date)
                            assert.propertyVal(result.error[i].item, 'value', incorrectLogsArr[i].value)
                            assert.propertyVal(result.error[i].item, 'type', incorrectLogsArr[i].type)
                            assert.propertyVal(result.error[i].item, 'child_id', incorrectLogsArr[i].child_id)
                        }

                        assert.isEmpty(result.success)
                    })
            })
        })

        context('when some of the logs in the array are incorrect (date and type are invalid)', () => {
            it('should perform the operations of creating and updating normally for the correct logs and returning a response ' +
                'of type MultiStatus<Log> with the description of success and error cases of each log', () => {
                return logService.addLogs(mixedLogsArr)
                    .then(result => {
                        for (let i = 0; i < result.success.length; i++) {
                            assert.propertyVal(result.success[i], 'code', HttpStatus.CREATED)
                            assert.property(result.success[i].item, 'id')
                            assert.property(result.success[i].item, 'date')
                            assert.property(result.success[i].item, 'value')
                            assert.property(result.success[i].item, 'type')
                            assert.property(result.success[i].item, 'child_id')
                        }

                        assert.propertyVal(result.error[0], 'message', Strings.ERROR_MESSAGE.INVALID_DATE_FORMAT
                            .replace('{0}', '20199-03-08'))
                        assert.propertyVal(result.error[0], 'description',
                            Strings.ERROR_MESSAGE.INVALID_DATE_FORMAT_DESC)
                        assert.propertyVal(result.error[1], 'message',
                            Strings.ERROR_MESSAGE.INVALID_FIELDS)
                        assert.propertyVal(result.error[1], 'description',
                            'The names of the allowed types are: ' +
                            'steps, calories, active_minutes, lightly_active_minutes, sedentary_minutes.')

                        for (let i = 0; i < result.error.length; i++) {
                            assert.propertyVal(result.error[i], 'code', HttpStatus.BAD_REQUEST)
                            assert.propertyVal(result.error[i].item, 'id', mixedLogsArr[i + 4].id)
                            assert.propertyVal(result.error[i].item, 'date', mixedLogsArr[i + 4].date)
                            assert.propertyVal(result.error[i].item, 'value', mixedLogsArr[i + 4].value)
                            assert.propertyVal(result.error[i].item, 'type', mixedLogsArr[i + 4].type)
                            assert.propertyVal(result.error[i].item, 'child_id', mixedLogsArr[i + 4].child_id)
                        }
                    })
            })
        })

        context('when some of the logs in the array are incorrect (negative value)', () => {
            it('should perform the operations of creating and updating normally for the correct logs and returning a response ' +
                'of type MultiStatus<Log> with the description of success and error cases of each log', () => {
                incorrectLog.date = '2019-03-10'
                incorrectLog.value = -((Math.floor(Math.random() * 10 + 1)) * 100)

                return logService.addLogs(mixedLogsArr)
                    .then(result => {
                        for (let i = 0; i < result.success.length; i++) {
                            assert.propertyVal(result.success[i], 'code', HttpStatus.CREATED)
                            assert.property(result.success[i].item, 'id')
                            assert.property(result.success[i].item, 'date')
                            assert.property(result.success[i].item, 'value')
                            assert.property(result.success[i].item, 'type')
                            assert.property(result.success[i].item, 'child_id')
                        }

                        assert.propertyVal(result.error[0], 'message',
                            Strings.ERROR_MESSAGE.INVALID_FIELDS)
                        assert.propertyVal(result.error[0], 'description', Strings.ERROR_MESSAGE.NEGATIVE_NUMBER
                            .replace('{0}', 'value'))
                        assert.propertyVal(result.error[1], 'message',
                            Strings.ERROR_MESSAGE.INVALID_FIELDS)
                        assert.propertyVal(result.error[1], 'description',
                            'The names of the allowed types are: ' +
                            'steps, calories, active_minutes, lightly_active_minutes, sedentary_minutes.')

                        for (let i = 0; i < result.error.length; i++) {
                            assert.propertyVal(result.error[i], 'code', HttpStatus.BAD_REQUEST)
                            assert.propertyVal(result.error[i].item, 'id', mixedLogsArr[i + 4].id)
                            assert.propertyVal(result.error[i].item, 'date', mixedLogsArr[i + 4].date)
                            assert.propertyVal(result.error[i].item, 'value', mixedLogsArr[i + 4].value)
                            assert.propertyVal(result.error[i].item, 'type', mixedLogsArr[i + 4].type)
                            assert.propertyVal(result.error[i].item, 'child_id', mixedLogsArr[i + 4].child_id)
                        }
                    })
            })
        })

        context('when some of the logs in the array are incorrect (child_id is invalid)', () => {
            it('should perform the operations of creating and updating normally for the correct logs and returning a response ' +
                'of type MultiStatus<Log> with the description of success and error cases of each log', () => {
                incorrectLog.value = ((Math.floor(Math.random() * 10 + 1)) * 100)
                incorrectLog.child_id = '507f1f77bcf86cd7994390112'

                return logService.addLogs(mixedLogsArr)
                    .then(result => {
                        for (let i = 0; i < result.success.length; i++) {
                            assert.propertyVal(result.success[i], 'code', HttpStatus.CREATED)
                            assert.property(result.success[i].item, 'id')
                            assert.property(result.success[i].item, 'date')
                            assert.property(result.success[i].item, 'value')
                            assert.property(result.success[i].item, 'type')
                            assert.property(result.success[i].item, 'child_id')
                        }

                        assert.propertyVal(result.error[0], 'message', Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                        assert.propertyVal(result.error[0], 'description',
                            Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                        assert.propertyVal(result.error[1], 'message',
                            Strings.ERROR_MESSAGE.INVALID_FIELDS)
                        assert.propertyVal(result.error[1], 'description',
                            'The names of the allowed types are: ' +
                            'steps, calories, active_minutes, lightly_active_minutes, sedentary_minutes.')

                        for (let i = 0; i < result.error.length; i++) {
                            assert.propertyVal(result.error[i], 'code', HttpStatus.BAD_REQUEST)
                            assert.propertyVal(result.error[i].item, 'id', mixedLogsArr[i + 4].id)
                            assert.propertyVal(result.error[i].item, 'date', mixedLogsArr[i + 4].date)
                            assert.propertyVal(result.error[i].item, 'value', mixedLogsArr[i + 4].value)
                            assert.propertyVal(result.error[i].item, 'type', mixedLogsArr[i + 4].type)
                            assert.propertyVal(result.error[i].item, 'child_id', mixedLogsArr[i + 4].child_id)
                        }
                    })
            })
        })

        context('when some of the logs in the array are incorrect (missing fields)', () => {
            it('should perform the operations of creating and updating normally for the correct logs and returning a response ' +
                'of type MultiStatus<Log> with the description of success and error cases of each log', () => {
                incorrectLog.date = undefined!
                incorrectLog.value = undefined!
                incorrectLog.type = undefined!
                incorrectLog.child_id = ''

                return logService.addLogs(mixedLogsArr)
                    .then(result => {
                        for (let i = 0; i < result.success.length; i++) {
                            assert.propertyVal(result.success[i], 'code', HttpStatus.CREATED)
                            assert.property(result.success[i].item, 'id')
                            assert.property(result.success[i].item, 'date')
                            assert.property(result.success[i].item, 'value')
                            assert.property(result.success[i].item, 'type')
                            assert.property(result.success[i].item, 'child_id')
                        }

                        assert.propertyVal(result.error[0], 'message',
                            Strings.ERROR_MESSAGE.REQUIRED_FIELDS)
                        assert.propertyVal(result.error[0], 'description',
                            Strings.ERROR_MESSAGE.REQUIRED_FIELDS_DESC
                                .replace('{0}', 'type, date, value, child_id'))
                        assert.propertyVal(result.error[1], 'message',
                            Strings.ERROR_MESSAGE.INVALID_FIELDS)
                        assert.propertyVal(result.error[1], 'description',
                            'The names of the allowed types are: ' +
                            'steps, calories, active_minutes, lightly_active_minutes, sedentary_minutes.')

                        for (let i = 0; i < result.error.length; i++) {
                            assert.propertyVal(result.error[i], 'code', HttpStatus.BAD_REQUEST)
                            assert.propertyVal(result.error[i].item, 'id', mixedLogsArr[i + 4].id)
                            assert.propertyVal(result.error[i].item, 'date', mixedLogsArr[i + 4].date)
                            assert.propertyVal(result.error[i].item, 'value', mixedLogsArr[i + 4].value)
                            assert.propertyVal(result.error[i].item, 'type', mixedLogsArr[i + 4].type)
                            assert.propertyVal(result.error[i].item, 'child_id', mixedLogsArr[i + 4].child_id)
                        }
                    })
            })
        })
    })

    /**
     * Method: getByChildAndDate(childId: string, dateStart: Date, dateEnd: Date, query: IQuery)
     */
    describe('getByChildAndDate(childId: string, dateStart: Date, dateEnd: Date, query: IQuery)', () => {
        context('when the parameters are correct and there are corresponding logs with the query', () => {
            it('should return a ChildLog with steps and/or calories logs', () => {

                return logService.getByChildAndDate(correctLogsArr[0].child_id, correctLogsArr[0].date, correctLogsArr[1].date)
                    .then(result => {
                        assert.property(result, 'steps')
                        assert.property(result, 'calories')
                        assert.property(result, 'active_minutes')
                        assert.property(result, 'lightly_active_minutes')
                        assert.property(result, 'sedentary_minutes')
                    })
            })
        })

        context('when the parameters are correct but there are no corresponding logs with the query', () => {
            it('should return an empty ChildLog', () => {
                correctLogsArr[0].child_id = '507f1f77bcf86cd799439011'

                return logService.getByChildAndDate(correctLogsArr[0].child_id, correctLogsArr[0].date, correctLogsArr[1].date)
                    .then(result => {
                        assert.isNotEmpty(result.steps)
                        assert.isNotEmpty(result.calories)
                        assert.isNotEmpty(result.active_minutes)
                        assert.isNotEmpty(result.lightly_active_minutes)
                        assert.isNotEmpty(result.sedentary_minutes)
                    })
            })
        })

        context('when the parameters are incorrect (child_id is invalid)', () => {
            it('should throw a ValidationException', () => {
                correctLogsArr[0].child_id = '507f1f77bcf86cd7994390112'

                return logService.getByChildAndDate(correctLogsArr[0].child_id, correctLogsArr[0].date, correctLogsArr[1].date)
                    .catch(err => {
                        assert.propertyVal(err, 'message', Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })

        context('when the parameters are incorrect (dateStart is invalid)', () => {
            it('should throw a ValidationException', () => {
                correctLogsArr[0].child_id = '507f1f77bcf86cd799439011'
                correctLogsArr[0].date = '20199-03-18'

                return logService.getByChildAndDate(correctLogsArr[0].child_id, correctLogsArr[0].date, correctLogsArr[1].date)
                    .catch(err => {
                        assert.propertyVal(err, 'message', Strings.ERROR_MESSAGE.INVALID_DATE_FORMAT
                            .replace('{0}', '20199-03-18'))
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.INVALID_DATE_FORMAT_DESC)
                    })
            })
        })

        context('when the parameters are incorrect (dateEnd is invalid)', () => {
            it('should throw a ValidationException', () => {
                correctLogsArr[0].child_id = '507f1f77bcf86cd799439011'
                correctLogsArr[0].date = '2019-03-18'
                correctLogsArr[1].date = '20199-03-18'

                return logService.getByChildAndDate(correctLogsArr[0].child_id, correctLogsArr[0].date, correctLogsArr[1].date)
                    .catch(err => {
                        assert.propertyVal(err, 'message', Strings.ERROR_MESSAGE.INVALID_DATE_FORMAT
                            .replace('{0}', '20199-03-18'))
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.INVALID_DATE_FORMAT_DESC)
                    })
            })
        })

        context('when the parameters are invalid (date range is invalid)', () => {
            it('should throw a ValidationException', () => {
                return logService.getByChildAndDate(correctLogsArr[0].child_id, '2018-03-18', '2019-03-27')
                    .catch(err => {
                        assert.propertyVal(err, 'message', Strings.ERROR_MESSAGE.DATE_RANGE_INVALID
                            .replace('{0}', '2018-03-18').replace('{1}', '2019-03-27'))
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.DATE_RANGE_EXCEED_YEAR_DESC)
                    })
            })
        })
    })

    /**
     * Method: getByChildResourceAndDate(childId: string, desiredResource: LogType, dateStart: string, dateEnd: string, query: IQuery)
     */
    describe('getByChildResourceAndDate(childId: string, desiredResource: LogType, dateStart: string, dateEnd: string, ' +
        'query: IQuery)', () => {
        context('when the parameters are correct and there are corresponding logs with the query', () => {
            it('should return the logs array', () => {
                correctLogsArr[0].child_id = '507f1f77bcf86cd799439012'
                correctLogsArr[1].date = '2019-03-20'

                return logService.getByChildResourceAndDate(correctLogsArr[0].child_id, correctLogsArr[0].type,
                    correctLogsArr[0].date, correctLogsArr[1].date)
                    .then(result => {
                        assert.isArray(result)
                        assert.isNotEmpty(result)
                    })
            })
        })

        context('when the parameters are correct but there are no corresponding logs with the query', () => {
            it('should return an empty log array', () => {
                correctLogsArr[0].child_id = '507f1f77bcf86cd799439011'

                return logService.getByChildResourceAndDate(correctLogsArr[0].child_id, correctLogsArr[0].type,
                    correctLogsArr[0].date, correctLogsArr[1].date)
                    .then(result => {
                        assert.isArray(result)
                        assert.isNotEmpty(result)
                    })
            })
        })

        context('when the parameters are incorrect (child_id is invalid)', () => {
            it('should throw a ValidationException', () => {
                correctLogsArr[0].child_id = '507f1f77bcf86cd7994390112'

                return logService.getByChildResourceAndDate(correctLogsArr[0].child_id, correctLogsArr[0].type,
                    correctLogsArr[0].date, correctLogsArr[1].date)
                    .catch(err => {
                        assert.propertyVal(err, 'message', Strings.CHILD.PARAM_ID_NOT_VALID_FORMAT)
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })

        context('when the parameters are incorrect (type is invalid)', () => {
            it('should throw a ValidationException', () => {
                correctLogsArr[0].child_id = '507f1f77bcf86cd799439011'

                return logService.getByChildResourceAndDate(correctLogsArr[0].child_id, otherIncorrectLog.type,
                    correctLogsArr[0].date, correctLogsArr[1].date)
                    .catch(err => {
                        assert.propertyVal(err, 'message',
                            Strings.ERROR_MESSAGE.INVALID_FIELDS)
                        assert.propertyVal(err, 'description',
                            'The names of the allowed types are: ' +
                            'steps, calories, active_minutes, lightly_active_minutes, sedentary_minutes.')
                    })
            })
        })

        context('when the parameters are incorrect (dateStart is invalid)', () => {
            it('should throw a ValidationException', () => {
                correctLogsArr[0].date = '20199-03-18'

                return logService.getByChildResourceAndDate(correctLogsArr[0].child_id, correctLogsArr[0].type,
                    correctLogsArr[0].date, correctLogsArr[1].date)
                    .catch(err => {
                        assert.propertyVal(err, 'message', Strings.ERROR_MESSAGE.INVALID_DATE_FORMAT
                            .replace('{0}', '20199-03-18'))
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.INVALID_DATE_FORMAT_DESC)
                    })
            })
        })

        context('when the parameters are incorrect (dateEnd is invalid)', () => {
            it('should throw a ValidationException', () => {
                correctLogsArr[0].date = '2019-03-18'
                correctLogsArr[1].date = '20199-03-18'

                return logService.getByChildResourceAndDate(correctLogsArr[0].child_id, correctLogsArr[0].type,
                    correctLogsArr[0].date, correctLogsArr[1].date)
                    .catch(err => {
                        assert.propertyVal(err, 'message', Strings.ERROR_MESSAGE.INVALID_DATE_FORMAT
                            .replace('{0}', '20199-03-18'))
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.INVALID_DATE_FORMAT_DESC)
                    })
            })
        })

        context('when the parameters are invalid (date range is invalid)', () => {
            it('should throw a ValidationException', () => {

                return logService.getByChildResourceAndDate(correctLogsArr[0].child_id, correctLogsArr[0].type,
                    '2018-03-18', '2019-03-27')
                    .catch(err => {
                        assert.propertyVal(err, 'message', Strings.ERROR_MESSAGE.DATE_RANGE_INVALID
                            .replace('{0}', '2018-03-18').replace('{1}', '2019-03-27'))
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.DATE_RANGE_EXCEED_YEAR_DESC)
                    })
            })
        })
    })
})
