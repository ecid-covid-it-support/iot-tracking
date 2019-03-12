import { injectable } from 'inversify'
import { IEntityMapper } from '../../port/entity.mapper.interface'
import {Log} from '../../../application/domain/model/log'
import { LogEntity } from '../log.entity'

@injectable()
export class LogEntityMapper implements IEntityMapper<Log, LogEntity> {

    public transform(item: any): any {
        if (item instanceof Log) return this.modelToModelEntity(item)
        return this.jsonToModel(item) // json
    }

    /**
     * Convert {Log} for {LogEntity}.
     *
     * @param item
     */
    public modelToModelEntity(item: Log): LogEntity {
        const result: LogEntity = new LogEntity()

        if (item.id) result.id = item.id
        if (item.date) result.date = new Date((item.date).concat('T00:00:00'))
        if (item.value !== undefined) result.value = item.value
        if (item.type) result.type = item.type
        if (item.child_id) result.child_id = item.child_id

        return result
    }

    /**
     * Convert {LogEntity} for {Log}.
     *
     * @see Each attribute must be mapped only if it contains an assigned value,
     * because at some point the attribute accessed may not exist.
     * @param item
     */
    public modelEntityToModel(item: LogEntity): Log {
        throw Error('Not implemented!')
    }

    /**
     * Convert JSON for Log.
     *
     * @see Each attribute must be mapped only if it contains an assigned value,
     * because at some point the attribute accessed may not exist.
     * @param json
     */
    public jsonToModel(json: any): Log {
        const result: Log = new Log()

        if (json.id !== undefined) result.id = json.id
        if (json.date !== undefined) result.date = (json.date.toLocaleString()).replace(' 00:00:00', '')
        if (json.value !== undefined) result.value = json.value
        if (json.type !== undefined) result.type = json.type
        if (json.child_id !== undefined) result.child_id = json.child_id

        return result
    }
}