import sinon from 'sinon'
import { assert } from 'chai'
import { EntityMapperMock } from '../../mocks/entity.mapper.mock'
import { CustomLoggerMock } from '../../mocks/custom.logger.mock'
import { ObjectID } from 'bson'
import { Sleep } from '../../../src/application/domain/model/sleep'
import { SleepMock } from '../../mocks/sleep.mock'
import { SleepRepoModel } from '../../../src/infrastructure/database/schema/sleep.schema'
import { ISleepRepository } from '../../../src/application/port/sleep.repository.interface'
import { SleepRepository } from '../../../src/infrastructure/repository/sleep.repository'

require('sinon-mongoose')

describe('Repositories: Sleep', () => {
    const defaultSleep: Sleep = new SleepMock()

    const modelFake: any = SleepRepoModel
    const repo: ISleepRepository = new SleepRepository(modelFake, new EntityMapperMock(), new CustomLoggerMock())

    const queryMock: any = {
        toJSON: () => {
            return {
                fields: {},
                ordination: {},
                pagination: { page: 1, limit: 100, skip: 0 },
                filters: {  start_time: defaultSleep.start_time,
                            child_id: defaultSleep.child_id }
            }
        }
    }

    afterEach(() => {
        sinon.restore()
    })

    describe('checkExist(sleep: Sleep)', () => {
        context('when the sleep is found', () => {
            it('should return true if exists in search by the filters bellow', () => {
                sinon
                    .mock(modelFake)
                    .expects('findOne')
                    .withArgs(queryMock.toJSON().filters)
                    .chain('exec')
                    .resolves(true)

                return repo.checkExist(defaultSleep)
                    .then(result => {
                        assert.isTrue(result)
                    })
            })
        })

        context('when the sleep is not found', () => {
            it('should return false', () => {
                sinon
                    .mock(modelFake)
                    .expects('findOne')
                    .withArgs(queryMock.toJSON().filters)
                    .chain('exec')
                    .resolves(false)

                return repo.checkExist(defaultSleep)
                    .then(result => {
                        assert.isFalse(result)
                    })
            })
        })

        context('when the sleep start_time is undefined', () => {
            it('should throw a RepositoryException', () => {
                defaultSleep.start_time = undefined

                sinon
                    .mock(modelFake)
                    .expects('findOne')
                    .withArgs(queryMock.toJSON().filters)
                    .chain('exec')
                    .rejects({ message: 'An internal error has occurred in the database!',
                               description: 'Please try again later...' })

                return repo.checkExist(defaultSleep)
                    .catch((err: any) => {
                        assert.propertyVal(err, 'message', 'An internal error has occurred in the database!')
                        assert.propertyVal(err, 'description', 'Please try again later...')
                    })
            })
        })

        context('when the sleep id is undefined', () => {
            it('should throw a RepositoryException', () => {
                defaultSleep.start_time = new Date()
                defaultSleep.id = undefined

                sinon
                    .mock(modelFake)
                    .expects('findOne')
                    .withArgs(queryMock.toJSON().filters)
                    .chain('exec')
                    .rejects({ message: 'An internal error has occurred in the database!',
                               description: 'Please try again later...' })

                return repo.checkExist(defaultSleep)
                    .catch((err: any) => {
                        assert.propertyVal(err, 'message', 'An internal error has occurred in the database!')
                        assert.propertyVal(err, 'description', 'Please try again later...')
                    })
            })
        })
    })

    describe('updateByChild(sleep: Sleep)', () => {

        const customQueryMock: any = {
            toJSON: () => {
                return {
                    fields: {},
                    ordination: {},
                    pagination: { page: 1, limit: 100, skip: 0 },
                    filters: {  _id: defaultSleep.id,
                        child_id: defaultSleep.child_id }
                }
            }
        }

        context('when the sleep is found and the update operation is done successfully', () => {
            it('should return the updated sleep', () => {
                defaultSleep.id = `${new ObjectID()}`

                sinon
                    .mock(modelFake)
                    .expects('findOneAndUpdate')
                    .withArgs(customQueryMock.toJSON().filters)
                    .chain('exec')
                    .resolves(defaultSleep)

                return repo.updateByChild(defaultSleep)
                    .then(sleep => {
                        sleep = sleep.toJSON()

                        assert.propertyVal(sleep, 'id', sleep.id)
                        assert.propertyVal(sleep, 'start_time', sleep.start_time)
                        assert.propertyVal(sleep, 'end_time', sleep.end_time)
                        assert.propertyVal(sleep, 'duration', sleep.duration)
                        assert.propertyVal(sleep, 'pattern', sleep.pattern)
                        assert.propertyVal(sleep, 'child_id', sleep.child_id)
                    })
            })
        })

        context('when the sleep is not found', () => {
            it('should return undefined representing that sleep was not found', () => {
                sinon
                    .mock(modelFake)
                    .expects('findOneAndUpdate')
                    .withArgs(customQueryMock.toJSON().filters)
                    .chain('exec')
                    .resolves(undefined)

                return repo.updateByChild(defaultSleep)
                    .then((result: any) => {
                        assert.isUndefined(result)
                    })
            })
        })

        context('when the sleep id is invalid', () => {
            it('should return undefined representing that there is an invalid parameter', () => {
                defaultSleep.id = '5b4b'

                sinon
                    .mock(modelFake)
                    .expects('findOneAndUpdate')
                    .withArgs(customQueryMock.toJSON().filters)
                    .chain('exec')
                    .resolves(undefined)

                return repo.updateByChild(defaultSleep)
                    .then((result: any) => {
                        assert.isUndefined(result)
                    })
            })
        })

        context('when the sleep child_id is invalid', () => {
            it('should return undefined representing that there is an invalid parameter', () => {
                defaultSleep.id = `${new ObjectID()}`
                defaultSleep.child_id = '5b4b'

                sinon
                    .mock(modelFake)
                    .expects('findOneAndUpdate')
                    .withArgs(customQueryMock.toJSON().filters)
                    .chain('exec')
                    .resolves(undefined)

                return repo.updateByChild(defaultSleep)
                    .then((result: any) => {
                        assert.isUndefined(result)
                    })
            })
        })

        context('when a database error occurs', () => {
            it('should return a empty list', async () => {
                defaultSleep.child_id = '5a62be07de34500146d9c544'
                defaultSleep.start_time = undefined

                sinon
                    .mock(modelFake)
                    .expects('findOneAndUpdate')
                    .withArgs(customQueryMock.toJSON().filters)
                    .chain('exec')
                    .rejects({ message: 'An internal error has occurred in the database!',
                               description: 'Please try again later...' })

                return await repo.updateByChild(defaultSleep)
                    .catch (err => {
                        assert.propertyVal(err, 'message', 'An internal error has occurred in the database!')
                        assert.propertyVal(err, 'description', 'Please try again later...')
                    })
            })
        })
    })

    describe('removeByChild(sleepId: string, childId: string)', () => {
        context('when the sleep is found and the delete operation is done successfully', () => {
            it('should return true for confirm delete', () => {
                defaultSleep.child_id = '5a62be07de34500146d9c544'

                sinon
                    .mock(modelFake)
                    .expects('findOneAndDelete')
                    .withArgs({ child_id: defaultSleep.child_id, _id: defaultSleep.id })
                    .chain('exec')
                    .resolves(true)

                return repo.removeByChild(defaultSleep.id!, defaultSleep.child_id)
                    .then((isDeleted: boolean) => {
                        assert.isTrue(isDeleted)
                    })
            })
        })

        context('when the sleep is not found', () => {
            it('should return false for confirm that the sleep was not found', () => {
                const randomChildId: any = new ObjectID()
                const randomId: any = new ObjectID()

                sinon
                    .mock(modelFake)
                    .expects('findOneAndDelete')
                    .withArgs({ child_id: randomChildId, _id: randomId })
                    .chain('exec')
                    .resolves(false)

                return repo.removeByChild(randomId, randomChildId)
                    .then((isDeleted: boolean) => {
                        assert.isFalse(isDeleted)
                    })
            })
        })

        context('when the sleep id is invalid', () => {
            it('should return false for confirm that there is an invalid parameter', () => {
                defaultSleep.id = '1a2b3c'

                sinon
                    .mock(modelFake)
                    .expects('findOneAndDelete')
                    .withArgs({ child_id: defaultSleep.child_id, _id: defaultSleep.id })
                    .chain('exec')
                    .resolves(false)

                return repo.removeByChild(defaultSleep.id, defaultSleep.child_id)
                    .then((isDeleted: boolean) => {
                        assert.isFalse(isDeleted)
                    })
            })
        })

        context('when the sleep child_id is invalid', () => {
            it('should return false for confirm that there is an invalid parameter', () => {
                defaultSleep.id = `${new ObjectID()}`
                defaultSleep.child_id = '1a2b3c'

                sinon
                    .mock(modelFake)
                    .expects('findOneAndDelete')
                    .withArgs({ child_id: defaultSleep.child_id, _id: defaultSleep.id })
                    .chain('exec')
                    .resolves(false)

                return repo.removeByChild(defaultSleep.id!, defaultSleep.child_id)
                    .then((isDeleted: boolean) => {
                        assert.isFalse(isDeleted)
                    })
            })
        })

        context('when a database error occurs', () => {
            it('should return a empty list', async () => {
                defaultSleep.child_id = '5a62be07de34500146d9c544'
                defaultSleep.start_time = undefined

                sinon
                    .mock(modelFake)
                    .expects('findOneAndDelete')
                    .withArgs({ child_id: defaultSleep.child_id, _id: defaultSleep.id })
                    .chain('exec')
                    .rejects({ message: 'An internal error has occurred in the database!',
                               description: 'Please try again later...' })

                return await repo.removeByChild(defaultSleep.id!, defaultSleep.child_id)
                    .catch (err => {
                        assert.propertyVal(err, 'message', 'An internal error has occurred in the database!')
                        assert.propertyVal(err, 'description', 'Please try again later...')
                    })
            })
        })
    })
})
