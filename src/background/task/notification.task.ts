import { IBackgroundTask } from '../../application/port/background.task.interface'
import { inject, injectable } from 'inversify'
import { Identifier } from '../../di/identifiers'
import { IEventBus } from '../../infrastructure/port/eventbus.interface'
import { IEnvironmentRepository } from '../../application/port/environment.repository.interface'
import { ILogger } from '../../utils/custom.logger'
import cron from 'cron'
import { Environment } from '../../application/domain/model/environment'
import { Measurement } from '../../application/domain/model/measurement'

@injectable()
export class NotificationTask implements IBackgroundTask {
    private job: any

    constructor(
        @inject(Identifier.RABBITMQ_EVENT_BUS) private readonly _eventBus: IEventBus,
        @inject(Identifier.ENVIRONMENT_REPOSITORY) private readonly _environmentRepository: IEnvironmentRepository,
        @inject(Identifier.LOGGER) private readonly _logger: ILogger,
        private readonly numberOfDays: number,
        private readonly expression_auto_notification?: string
    ) {
    }

    public run(): void {
        try {
            if (this.expression_auto_notification) {
                this.job = new cron.CronJob(`${this.expression_auto_notification}`, () => this.checkInactivity())
                this.job.start()
            } else this.checkInactivity()

            this._logger.debug('Notification task started successfully!')
        } catch (err) {
            this._logger.error(`An error occurred initializing the Notification task. ${err.message}`)
        }
    }

    public stop(): Promise<void> {
        if (this.expression_auto_notification) this.job.stop()
        return this._eventBus.dispose()
    }

    private sendNotification(environments: Array<Environment>): void {
        for (const environment of environments) {
            let notification

            for (const measurement of environment.measurements!) {
                try {
                    notification = this.buildNotification(environment, measurement)
                } catch (err) {
                    this._logger.error(`An error occurred while trying to build the notification. ${err.message}`)
                }

                if (notification) {
                    this._eventBus.bus
                        .pubSendNotification(notification)
                        .then(() => {
                            this._logger.info('\'iot:miss_data\' notification sent')
                        })
                        .catch(err => {
                            this._logger.error(`An error occurred while trying to send a notification about the Environment with ID: `
                                .concat(`${environment.id}. ${err.message}`))
                        })
                }
            }
        }
    }

    private buildNotification(environment: Environment, measurement: Measurement): any {
        const now = new Date()
        const timestamp: Date = environment.timestamp
        const diff = Math.abs(now.getTime() - timestamp.getTime())
        const calc_days_since = Math.trunc(diff / (1000 * 60 * 60 * 24))

        return {
            notification_type: 'iot:miss_data',
            institution_id: environment.institution_id,
            days_since: calc_days_since,
            sensor_type: measurement.type,
            location: {
                local: environment.location!.local,
                room: environment.location!.room
            }
        }
    }

    private checkInactivity(): void {
        this._environmentRepository.findInactiveEnvironments(this.numberOfDays)
            .then(result => {
                if (result.length) this.sendNotification(result)
            })
            .catch(err => {
                this._logger.error(`An error occurred while trying to retrieve Environment data. ${err.message}`)
            })
    }
}
