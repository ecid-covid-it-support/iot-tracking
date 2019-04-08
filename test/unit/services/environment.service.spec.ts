import sinon from 'sinon'
import { assert } from 'chai'
import { EnvironmentMock } from '../../mocks/environment.mock'
import { EnvironmentService } from '../../../src/application/service/environment.service'
import { CustomLoggerMock } from '../../mocks/custom.logger.mock'
import { EventBusRabbitmqMock } from '../../mocks/event.bus.rabbitmq.mock'
import { EnvironmentRepoModel } from '../../../src/infrastructure/database/schema/environment.schema'
import { IEnvironmentRepository } from '../../../src/application/port/environment.repository.interface'
import { IIntegrationEventRepository } from '../../../src/application/port/integration.event.repository.interface'
import { IConnectionEventBus } from '../../../src/infrastructure/port/connection.event.bus.interface'
import { EnvironmentRepositoryMock } from '../../mocks/environment.repository.mock'
import { IntegrationEventRepositoryMock } from '../../mocks/integration.event.repository.mock'
import { ConnectionRabbitmqMock } from '../../mocks/connection.rabbitmq.mock'
import { IConnectionFactory } from '../../../src/infrastructure/port/connection.factory.interface'
import { ConnectionFactoryRabbitmqMock } from '../../mocks/connection.factory.rabbitmq.mock'
import { IQuery } from '../../../src/application/port/query.interface'
import { Query } from '../../../src/infrastructure/repository/query/query'
import { Strings } from '../../../src/utils/strings'
import { Environment } from '../../../src/application/domain/model/environment'
import { Measurement, MeasurementType } from '../../../src/application/domain/model/measurement'
import { IEventBus } from '../../../src/infrastructure/port/event.bus.interface'
import { ILogger } from '../../../src/utils/custom.logger'
import { MultiStatus } from '../../../src/application/domain/model/multi.status'
import { MultiStatusMock } from '../../mocks/multi.status.mock'

require('sinon-mongoose')

describe('Services: Environment', () => {
    // Environment Mock
    const environment: Environment = new EnvironmentMock()
    let incorrectEnvironment: Environment = new Environment()       // For incorrect operations
    // For GET route
    const environmentsArrGet: Array<Environment> = new Array<EnvironmentMock>()
    for (let i = 0; i < 3; i++) {
        environmentsArrGet.push(new EnvironmentMock())
    }
    // For POST route
    const correctEnvironmentsArr: Array<Environment> = new Array<EnvironmentMock>()
    for (let i = 0; i < 3; i++) {
        correctEnvironmentsArr.push(new EnvironmentMock())
    }

    const mixedEnvironmentsArr: Array<Environment> = new Array<EnvironmentMock>()
    for (let i = 0; i < 3; i++) {
        mixedEnvironmentsArr.push(new EnvironmentMock())
    }
    mixedEnvironmentsArr[1].timestamp = undefined!

    /**
     * Mock MultiStatus responses
     */
    // MultiStatus totally correct
    const multiStatusMock: MultiStatusMock<Environment> = new MultiStatusMock<Environment>()
    const multiStatusCorrect: MultiStatus<Environment> = multiStatusMock.generateMultiStatus(correctEnvironmentsArr)
    // const multiStatusMixed: MultiStatus<Environment> = multiStatusMock.generateMultiStatus(mixedEnvironmentsArr)    // Mixed MultiStatus

    const modelFake: any = EnvironmentRepoModel
    const environmentRepo: IEnvironmentRepository = new EnvironmentRepositoryMock()
    const integrationRepo: IIntegrationEventRepository = new IntegrationEventRepositoryMock()

    const connectionFactoryRabbitmq: IConnectionFactory = new ConnectionFactoryRabbitmqMock()
    const connectionRabbitmqPub: IConnectionEventBus = new ConnectionRabbitmqMock(connectionFactoryRabbitmq)
    const connectionRabbitmqSub: IConnectionEventBus = new ConnectionRabbitmqMock(connectionFactoryRabbitmq)
    const eventBusRabbitmq: IEventBus = new EventBusRabbitmqMock(connectionRabbitmqPub, connectionRabbitmqSub)
    const customLogger: ILogger = new CustomLoggerMock()

    const environmentService: EnvironmentService = new EnvironmentService(environmentRepo, integrationRepo,
        eventBusRabbitmq, customLogger)

    before(async () => {
        try {
            await connectionRabbitmqPub.tryConnect(0, 500)
            await connectionRabbitmqSub.tryConnect(0, 500)
        } catch (err) {
            throw new Error('Failure on EnvironmentService unit test: ' + err.message)
        }
    })

    afterEach(() => {
        sinon.restore()
    })

    /**
     * Method "add(environment: Environment | Array<Environment>)" with Environment argument
     */
    describe('add(environment: Environment | Array<Environment>)', () => {
        context('when the Environment is correct, it still does not exist in the repository and there is a connection ' +
            'to the RabbitMQ', () => {
            it('should return the Environment that was added', () => {
                sinon
                    .mock(modelFake)
                    .expects('create')
                    .withArgs(environment)
                    .chain('exec')
                    .resolves(environment)

                return environmentService.add(environment)
                    .then(result => {
                        assert.propertyVal(result, 'id', environment.id)
                        assert.propertyVal(result, 'institution_id', environment.institution_id)
                        assert.propertyVal(result, 'location', environment.location)
                        if (result.toJSON().climatized) assert.propertyVal(result, 'climatized', environment.climatized)
                        assert.propertyVal(result, 'timestamp', environment.timestamp)
                        assert.propertyVal(result, 'measurements', environment.measurements)
                    })
            })
        })

        context('when the Environment is correct and does not yet exist in the repository but there is no connection ' +
            'to the RabbitMQ', () => {
            it('should return the Environment that was saved', () => {
                connectionRabbitmqPub.isConnected = false
                sinon
                    .mock(modelFake)
                    .expects('create')
                    .withArgs(environment)
                    .chain('exec')
                    .resolves(environment)

                return environmentService.add(environment)
                    .then(result => {
                        assert.propertyVal(result, 'id', environment.id)
                        assert.propertyVal(result, 'institution_id', environment.institution_id)
                        assert.propertyVal(result, 'location', environment.location)
                        if (result.toJSON().climatized) assert.propertyVal(result, 'climatized', environment.climatized)
                        assert.propertyVal(result, 'timestamp', environment.timestamp)
                        assert.propertyVal(result, 'measurements', environment.measurements)
                    })
            })
        })

        context('when the Environment is correct but already exists in the repository', () => {
            it('should throw a ConflictException', () => {
                connectionRabbitmqPub.isConnected = true
                environment.id = '507f1f77bcf86cd799439011'         // Make mock return true
                sinon
                    .mock(modelFake)
                    .expects('create')
                    .withArgs(environment)
                    .chain('exec')
                    .rejects({ message: 'Measurement of environment is already registered...' })

                return environmentService.add(environment)
                    .catch(err => {
                        assert.propertyVal(err, 'message', 'Measurement of environment is already registered...')
                    })
            })
        })

        context('when the Environment is incorrect (missing fields)', () => {
            it('should throw a ValidationException', () => {
                sinon
                    .mock(modelFake)
                    .expects('create')
                    .withArgs(incorrectEnvironment)
                    .chain('exec')
                    .rejects({ message: 'Required fields were not provided...',
                               description: 'Validation of environment measurements failed: timestamp, institution_id, ' +
                                   'location, measurements required!' })

                return environmentService.add(incorrectEnvironment)
                    .catch(err => {
                        assert.propertyVal(err, 'message', 'Required fields were not provided...')
                        assert.propertyVal(err, 'description', 'Validation of environment measurements failed: timestamp, ' +
                            'institution_id, location, measurements required!')
                    })
            })
        })

        context('when the Environment is incorrect (the institution_id is invalid)', () => {
            it('should throw a ValidationException', () => {
                incorrectEnvironment = new EnvironmentMock()
                incorrectEnvironment.institution_id = '507f1f77bcf86cd7994390112'
                sinon
                    .mock(modelFake)
                    .expects('create')
                    .withArgs(incorrectEnvironment)
                    .chain('exec')
                    .rejects({ message: Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT,
                               description: Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC })

                return environmentService.add(incorrectEnvironment)
                    .catch(err => {
                        assert.propertyVal(err, 'message', Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT)
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    })
            })
        })

        context('when the Environment is incorrect (the location is invalid)', () => {
            it('should throw a ValidationException', () => {
                incorrectEnvironment.institution_id = '507f1f77bcf86cd799439011'
                incorrectEnvironment.location!.local = ''
                incorrectEnvironment.location!.room = ''
                sinon
                    .mock(modelFake)
                    .expects('create')
                    .withArgs(incorrectEnvironment)
                    .chain('exec')
                    .rejects({ message: 'Location are not in a format that is supported...',
                               description: 'Validation of location failed: location local, location room is required!' })

                return environmentService.add(incorrectEnvironment)
                    .catch(err => {
                        assert.propertyVal(err, 'message', 'Location are not in a format that is supported...')
                        assert.propertyVal(err, 'description', 'Validation of location failed: location local, location room is required!')
                    })
            })
        })

        context('when the Environment is incorrect (the measurements array is empty)', () => {
            it('should throw a ValidationException', () => {
                incorrectEnvironment.location!.local = 'Indoor'
                incorrectEnvironment.location!.room = 'Room 01'
                incorrectEnvironment.measurements = new Array<Measurement>()
                sinon
                    .mock(modelFake)
                    .expects('create')
                    .withArgs(incorrectEnvironment)
                    .chain('exec')
                    .rejects({ message: 'Measurement are not in a format that is supported!',
                               description: 'The measurements collection must not be empty!' })

                return environmentService.add(incorrectEnvironment)
                    .catch(err => {
                        assert.propertyVal(err, 'message', 'Measurement are not in a format that is supported!')
                        assert.propertyVal(err, 'description', 'The measurements collection must not be empty!')
                    })
            })
        })

        context('when the Environment is incorrect (the measurements array has an item with invalid type)', () => {
            it('should throw a ValidationException', () => {
                incorrectEnvironment.measurements = [new Measurement(MeasurementType.HUMIDITY, 34, '%'),
                                            new Measurement('Temperatures', 40, '°C')]
                sinon
                    .mock(modelFake)
                    .expects('create')
                    .withArgs(incorrectEnvironment)
                    .chain('exec')
                    .rejects({ message: 'The type of measurement provided "temperatures" is not supported...',
                               description: 'The types allowed are: temperature, humidity.' })

                return environmentService.add(incorrectEnvironment)
                    .catch(err => {
                        assert.propertyVal(err, 'message', 'The type of measurement provided "temperatures" is not supported...')
                        assert.propertyVal(err, 'description', 'The types allowed are: temperature, humidity.')
                    })
            })
        })

        context('when the Environment is incorrect (the measurements array has an item with empty fields)', () => {
            it('should throw a ValidationException', () => {
                incorrectEnvironment.measurements = [new Measurement(MeasurementType.HUMIDITY, 34, '%'),
                                            new Measurement()]
                sinon
                    .mock(modelFake)
                    .expects('create')
                    .withArgs(incorrectEnvironment)
                    .chain('exec')
                    .rejects({ message: 'Measurement are not in a format that is supported!',
                               description: 'Validation of measurements failed: measurement type, measurement value, ' +
                                   'measurement unit is required!' })

                return environmentService.add(incorrectEnvironment)
                    .catch(err => {
                        assert.propertyVal(err, 'message', 'Measurement are not in a format that is supported!')
                        assert.propertyVal(err, 'description', 'Validation of measurements failed: measurement type, ' +
                            'measurement value, measurement unit is required!')
                    })
            })
        })
    })
    /**
     * Method "add(environment: Environment | Array<Environment>)" with Array<Environment> argument
     */
    describe('add(environment: Environment | Array<Environment>)', () => {
        context('when the Environment is correct, it still does not exist in the repository and there is a connection ' +
            'to the RabbitMQ', () => {
            it('should return the Environment that was added', () => {
                sinon
                    .mock(modelFake)
                    .expects('create')
                    .withArgs(correctEnvironmentsArr)
                    .chain('exec')
                    .resolves(multiStatusCorrect)

                return environmentService.add(correctEnvironmentsArr)
                    .then(result => {
                        for (let i = 0; i < result.toJSON().success.length; i++) {
                            assert.propertyVal(result.toJSON().success[i].item, 'id', correctEnvironmentsArr[i].id)
                            assert.propertyVal(result.toJSON().success[i].item, 'institution_id', correctEnvironmentsArr[i].institution_id)
                            assert.propertyVal(result.toJSON().success[i].item, 'location', correctEnvironmentsArr[i].location)
                            if (result.toJSON().success[i].item.climatized)
                                assert.propertyVal(result.toJSON().success[i].item, 'climatized', correctEnvironmentsArr[i].climatized)
                            assert.propertyVal(result.toJSON().success[i].item, 'timestamp', correctEnvironmentsArr[i].timestamp)
                            assert.propertyVal(result.toJSON().success[i].item, 'measurements', correctEnvironmentsArr[i].measurements)
                        }
                        assert.isEmpty(result.toJSON().error)
                    })
            })
        })
    })

    /**
     * Method "getAll(query: IQuery)"
     */
    describe('getAll(query: IQuery)', () => {
        context('when there is at least one environment object in the database that matches the query filters', () => {
            it('should return an Environment array', () => {
                const query: IQuery = new Query()
                query.filters = {
                    'timestamp': environment.timestamp,
                    'location.local': environment.location ? environment.location.local : undefined,
                    'location.room': environment.location ? environment.location.room : undefined,
                    'location.latitude': environment.location ? environment.location.latitude : undefined,
                    'location.longitude': environment.location ? environment.location.longitude : undefined
                }

                sinon
                    .mock(modelFake)
                    .expects('find')
                    .withArgs(query)
                    .chain('exec')
                    .resolves(environmentsArrGet)

                return environmentService.getAll(query)
                    .then(result => {
                        assert.isArray(result)
                        assert.isNotEmpty(result)
                    })
            })
        })

        context('when there is no environment object in the database that matches the query filters', () => {
            it('should return an empty array', () => {
                environment.timestamp = new Date('2018-03-01T03:00:00.000Z')
                const query: IQuery = new Query()
                query.filters = {
                    'timestamp': environment.timestamp,
                    'location.local': environment.location ? environment.location.local : undefined,
                    'location.room': environment.location ? environment.location.room : undefined,
                    'location.latitude': environment.location ? environment.location.latitude : undefined,
                    'location.longitude': environment.location ? environment.location.longitude : undefined
                }

                sinon
                    .mock(modelFake)
                    .expects('find')
                    .withArgs(query)
                    .chain('exec')
                    .resolves(new Array<EnvironmentMock>())

                return environmentService.getAll(query)
                    .then(result => {
                        assert.isArray(result)
                        assert.isEmpty(result)
                    })
            })
        })
    })

    /**
     * Method "remove(id: string)"
     */
    describe('remove(id: string)', () => {
        context('when there is an environment with the id used as parameter', () => {
            it('should return true', () => {
                environment.id = '507f1f77bcf86cd799439011'
                sinon
                    .mock(modelFake)
                    .expects('deleteOne')
                    .withArgs(environment.id)
                    .chain('exec')
                    .resolves(true)

                return environmentService.remove(environment.id!)
                    .then(result => {
                        assert.equal(result, true)
                    })
            })
        })

        context('when there is no environment with the id used as parameter', () => {
            it('should return false', () => {
                environment.id = '5c6dd16ea1a67d0034e6108b'
                sinon
                    .mock(modelFake)
                    .expects('deleteOne')
                    .withArgs(environment.id)
                    .chain('exec')
                    .resolves(false)

                return environmentService.remove(environment.id!)
                    .then(result => {
                        assert.equal(result, false)
                    })
            })
        })

        context('when there is an environment with the id used as parameter but there is no connection to the RabbitMQ', () => {
            it('should return true and save the event that will report the removal of the resource', () => {
                connectionRabbitmqPub.isConnected = false
                environment.id = '507f1f77bcf86cd799439011'
                sinon
                    .mock(modelFake)
                    .expects('deleteOne')
                    .withArgs(environment.id)
                    .chain('exec')
                    .resolves(true)

                return environmentService.remove(environment.id!)
                    .then(result => {
                        assert.equal(result, true)
                    })
            })
        })

        context('when the environment id is invalid', () => {
            it('should throw a ValidationException', () => {
                environment.id = '5c6dd16ea1a67d0034e6108b2'
                sinon
                    .mock(modelFake)
                    .expects('deleteOne')
                    .withArgs(environment.id)
                    .chain('exec')
                    .rejects({ message: Strings.ENVIRONMENT.PARAM_ID_NOT_VALID_FORMAT,
                               description: Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC })

                return environmentService.remove(environment.id!)
                    .catch (err => {
                        assert.propertyVal(err, 'message', Strings.ENVIRONMENT.PARAM_ID_NOT_VALID_FORMAT)
                        assert.propertyVal(err, 'description', Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                })
            })
        })
    })
})
