import { injectable } from 'inversify'
import { IRepository } from '../../../application/port/repository.interface'
import { RepositoryException } from '../../../application/domain/exception/repository.exception'
import { Entity } from '../../../application/domain/model/entity'
import { ValidationException } from '../../../application/domain/exception/validation.exception'
import { ConflictException } from '../../../application/domain/exception/conflict.exception'
import { IEntityMapper } from '../../port/entity.mapper.interface'
import { IQuery } from '../../../application/port/query.interface'
import { ILogger } from '../../../utils/custom.logger'
import { Strings } from '../../../utils/strings'

/**
 * Base implementation of the repository.
 *
 * @implements {IRepository<T>}
 * @template <T extends Entity, TModel extends Document>
 */
@injectable()
export abstract class BaseRepository<T extends Entity, TModel> implements IRepository<T> {

    protected constructor(
        readonly Model: any,
        readonly mapper: IEntityMapper<T, TModel>,
        readonly logger: ILogger
    ) {
    }

    public create(item: T): Promise<T> {
        const itemNew: TModel = this.mapper.transform(item)
        return new Promise<T>((resolve, reject) => {
            this.Model.create(itemNew)
                .then((result) => {
                    resolve(this.mapper.transform(result))
                })
                .catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }

    public find(query: IQuery): Promise<Array<T>> {
        const q: any = query.toJSON()
        return new Promise<Array<T>>((resolve, reject) => {
            this.Model.find(q.filters)
                .collation({ locale: 'en', caseLevel: true, numericOrdering: true, strength: 2 })
                .sort(q.ordination)
                .skip(Number((q.pagination.limit * q.pagination.page) - q.pagination.limit))
                .limit(Number(q.pagination.limit))
                .exec() // execute query
                .then((result: Array<TModel>) => {
                    resolve(result.map(item => this.mapper.transform(item)))
                })
                .catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }

    public findOne(query: IQuery): Promise<T> {
        const q: any = query.toJSON()
        return new Promise<T>((resolve, reject) => {
            this.Model.findOne(q.filters)
                .exec()
                .then((result: TModel) => {
                    if (!result) return resolve(undefined)
                    return resolve(this.mapper.transform(result))
                })
                .catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }

    public update(item: T): Promise<T> {
        const itemUp: any = this.mapper.transform(item)
        return new Promise<T>((resolve, reject) => {
            this.Model.findOneAndUpdate({ _id: itemUp.id }, itemUp, { new: true })
                .exec()
                .then((result: TModel) => {
                    if (!result) return resolve(undefined)
                    return resolve(this.mapper.transform(result))
                })
                .catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }

    public delete(id: string | number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.Model.findOneAndDelete({ _id: id })
                .exec()
                .then((result: TModel) => {
                    if (!result) return resolve(false)
                    return resolve(true)
                })
                .catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }

    public count(query: IQuery): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.Model.countDocuments(query.toJSON().filters)
                .exec()
                .then(result => resolve(Number(result)))
                .catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }

    protected mongoDBErrorListener(err: any): ValidationException | ConflictException | RepositoryException | undefined {
        if (err && err.name) {
            if (err.name === 'ValidationError') {
                return new ValidationException('Required fields were not provided!', err.message)
            } else if (err.name === 'CastError' || new RegExp(/(invalid format)/i).test(err)) {
                if (err.name === 'CastError' && err.kind) {
                    if (err.kind === 'date') {
                        return new ValidationException(`Datetime: ${err.value}`.concat(Strings.ERROR_MESSAGE.INVALID_DATE))
                    } else if (err.kind === 'ObjectId') {
                        return new ValidationException(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT,
                            Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                    } else if (err.kind === 'number') {
                        return new ValidationException(`The value \'${err.value}\' of ${err.path} field is not a number.`)
                    } else if (err.kind === 'Boolean') {
                        return new ValidationException(`The value \'${err.value}\' of ${err.path} field is not a boolean.`)
                    }
                }
                return new ValidationException(`The value \'${err.value}\' of ${err.path} field is invalid.`)
            } else if (err.name === 'MongoError' && err.code === 11000) {
                return new ConflictException(Strings.ERROR_MESSAGE.REPO_CREATE_CONFLICT)
            } else if (err.name === 'ObjectParameterError') {
                return new ValidationException('Invalid query parameters!')
            }
        }
        return new RepositoryException(err && err.message ? err.message : Strings.ERROR_MESSAGE.INTERNAL_SERVER_ERROR,
            err && err.description ? err.description : undefined)
    }
}
