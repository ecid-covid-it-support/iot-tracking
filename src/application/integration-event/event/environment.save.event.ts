import { IntegrationEvent } from './integration.event'
import { Environment } from '../../domain/model/environment'

export class EnvironmentSaveEvent extends IntegrationEvent<Environment> {
    constructor(public event_name: string, public timestamp?: Date, public environment?: Environment) {
        super(event_name, timestamp)
    }

    public toJSON(): any {
        if (!this.environment) return {}
        return {
            event_name: this.event_name,
            timestamp: this.timestamp,
            environment: this.environment.toJSON()
        }
    }
}