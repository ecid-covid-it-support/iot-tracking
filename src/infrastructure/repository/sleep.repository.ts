import { inject, injectable } from 'inversify'
import { Identifier } from '../../di/identifiers'
import { BaseRepository } from './base/base.repository'
import { Query } from './query/query'
import { ILogger } from '../../utils/custom.logger'
import { ISleepRepository } from '../../application/port/sleep.repository.interface'
import { Sleep } from '../../application/domain/model/sleep'
import { SleepEntity } from '../entity/sleep.entity'
import { IEntityMapper } from '../port/entity.mapper.interface'
import { IQuery } from '../../application/port/query.interface'

/**
 * Implementation of the sleep repository.
 *
 * @implements {ISleepRepository}
 */
@injectable()
export class SleepRepository extends BaseRepository<Sleep, SleepEntity> implements ISleepRepository {
    constructor(
        @inject(Identifier.SLEEP_REPO_MODEL) readonly sleepModel: any,
        @inject(Identifier.SLEEP_ENTITY_MAPPER) readonly sleepMapper: IEntityMapper<Sleep, SleepEntity>,
        @inject(Identifier.LOGGER) readonly logger: ILogger
    ) {
        super(sleepModel, sleepMapper, logger)
    }

    /**
     * Checks if a sleep already has a registration.
     * What differs from one sleep to another is the start date and associated child.
     *
     * @param sleep
     * @return {Promise<boolean>} True if it exists or False, otherwise
     * @throws {ValidationException | RepositoryException}
     */
    public async checkExist(sleep: Sleep): Promise<boolean> {
        const query: Query = new Query()
        return new Promise<boolean>((resolve, reject) => {
            if (sleep.start_time && sleep.child_id) {
                query.filters = { start_time: sleep.start_time, child_id: sleep.child_id }
            }
            super.findOne(query)
                .then((result: Sleep) => {
                    if (result) return resolve(true)
                    return resolve(false)
                })
                .catch(err => reject(err))
        })
    }

    /**
     * Update child sleep data.
     *
     * @param sleep Containing the data to be updated
     * @return {Promise<T>}
     * @throws {ValidationException | ConflictException | RepositoryException}
     */
    public updateByChild(sleep: Sleep): Promise<Sleep> {
        const itemUp: SleepEntity = this.sleepMapper.transform(sleep)
        return new Promise<Sleep>((resolve, reject) => {
            this.sleepModel.findOneAndUpdate({ child_id: sleep.child_id, _id: itemUp.id }, itemUp, { new: true })
                .exec()
                .then(result => {
                    if (!result) return resolve(undefined)
                    return resolve(this.sleepMapper.transform(result))
                })
                .catch(err => reject(super.mongoDBErrorListener(err)))
        })
    }

    /**
     * Removes sleep according to its unique identifier and related child.
     *
     * @param sleepId Unique identifier.
     * @param childId Child unique identifier.
     * @return {Promise<boolean>}
     * @throws {ValidationException | RepositoryException}
     */
    public removeByChild(sleepId: string, childId: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.sleepModel.findOneAndDelete({ child_id: childId, _id: sleepId })
                .exec()
                .then(result => {
                    if (!result) return resolve(false)
                    resolve(true)
                })
                .catch(err => reject(super.mongoDBErrorListener(err)))
        })
    }

    /**
     * Removes all sleep objects associated with the childId received.
     *
     * @param childId Child id associated with sleep objects.
     * @return {Promise<boolean>}
     * @throws {ValidationException | RepositoryException}
     */
    public async removeAllByChild(childId: string): Promise<boolean> {
        // Creates the query with the received parameter
        const query: IQuery = new Query()
        query.filters = { child_id: childId }

        return new Promise<boolean>((resolve, reject) => {
            this.sleepModel.deleteMany(query.filters)
                .then(result => {
                    if (!result) return resolve(false)
                    return resolve(true)
                })
                .catch(err => reject(super.mongoDBErrorListener(err)))
        })
    }

    /**
     * Returns the total of sleep objects of a child.
     *
     * @param childId Child id associated with Sleep objects.
     * @return {Promise<number>}
     * @throws {RepositoryException}
     */
    public countByChild(childId: string): Promise<number> {
        return super.count(new Query().fromJSON({ filters: { child_id: childId } }))
    }
}
