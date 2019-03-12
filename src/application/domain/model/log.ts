import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'
import { Entity } from './entity'

/**
 * Entity implementation of the individual log of the PhysicalActivity.
 *
 * @implements {IJSONSerializable, IJSONDeserializable<Log>}
 */
export class Log extends Entity implements IJSONSerializable, IJSONDeserializable<Log> {
    private _date!: string // Date of the log according to the format yyyy-MM-dd.
    private _value!: number // Total time in milliseconds spent in the day.
    private _type!: LogType // Log type
    private _child_id!: string // Child ID

    constructor(date?: string, value?: number, type?: LogType, child_id?: string) {
        super()
        if (date) this.date = date
        if (value) this.value = value
        if (type) this.type = type
        if (child_id) this.child_id = child_id
    }

    get date(): string {
        return this._date
    }

    set date(value: string) {
        this._date = value
    }

    get value(): number {
        return this._value
    }

    set value(value: number) {
        this._value = value
    }

    get type(): LogType {
        return this._type
    }

    set type(value: LogType) {
        this._type = value
    }

    get child_id(): string {
        return this._child_id
    }

    set child_id(value: string) {
        this._child_id = value
    }

    public fromJSON(json: any): Log {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.type !== undefined) this.type = json.type
        if (json.date !== undefined) this.date = json.date
        if (json.value !== undefined) this.value = json.value
        if (json.child_id !== undefined) this.child_id = json.child_id

        return this
    }

    public toJSON(): any {
        return {
            date: this.date,
            value: this.value,
        }
    }
}

export enum LogType {
    STEPS = 'steps',
    CALORIES = 'calories'
}