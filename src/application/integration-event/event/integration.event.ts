import { IJSONSerializable } from '../../domain/utils/json.serializable.interface'

export abstract class IntegrationEvent<T> implements IJSONSerializable {

    protected constructor(readonly event_name: string, readonly type: EventType, readonly timestamp?: Date) {
    }

    public toJSON(): any {
        return {
            event_name: this.event_name,
            timestamp: this.timestamp,
            type: this.type
        }
    }
}

export enum EventType {
    PHYSICAL_ACTIVITIES = 'physicalactivities',
    SLEEP = 'sleep',
    ENVIRONMENTS = 'environments',
    USERS = 'users',
    INSTITUTIONS = 'institutions'
}
