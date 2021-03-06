import { DIContainer } from '../../../di/di'
import { Identifier } from '../../../di/identifiers'
import { ILogger } from '../../../utils/custom.logger'
import { ValidationException } from '../../domain/exception/validation.exception'
import { ILogService } from '../../port/log.service.interface'
import { Log } from '../../domain/model/log'

/**
 * Handler for LogSyncEvent operation.
 *
 * @param event
 */
export const logSyncEventHandler = async (event: any) => {
    const logService: ILogService = DIContainer.get<ILogService>(Identifier.LOG_SERVICE)
    const logger: ILogger = DIContainer.get<ILogger>(Identifier.LOGGER)

    try {
        if (typeof event === 'string') event = JSON.parse(event)
        if (!event.log) {
            throw new ValidationException('Event received but could not be handled due to an error in the event format.')
        }
        if (event.log instanceof Array) {
            // 1. Convert physical activity array json to object.
            const logsArr: Array<Log> = event.log.map(item => new Log().fromJSON(item))

            // 2. Try to add activities
            logService.addLogs(logsArr)
                .then(result => {
                    logger.info(`Action for event ${event.event_name} associated with child with ID: `
                        .concat(`${logsArr[0].child_id} successfully held! Total successful items: `)
                        .concat(`${result.success.length} / Total items with error: ${result.error.length}`))
                })
                .catch((err) => {
                    throw err
                })
        }
    } catch (err) {
        logger.warn(`An error occurred while attempting `
            .concat(`perform the operation with the ${event.event_name} name event. ${err.message}`)
            .concat(err.description ? ' ' + err.description : ''))
    }
}
