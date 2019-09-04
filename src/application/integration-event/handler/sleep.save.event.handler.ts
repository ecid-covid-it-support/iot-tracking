// TODO Transform into function and register subscribe in task

// export class SleepSaveEventHandler implements IIntegrationEventHandler<SleepEvent> {
//     private count: number = 0
//
//     /**
//      * Creates an instance of SleepSaveEventHandler.
//      *
//      * @param _sleepRepository
//      * @param _logger
//      */
//     constructor(
//         @inject(Identifier.SLEEP_REPOSITORY) private readonly _sleepRepository: ISleepRepository,
//         @inject(Identifier.LOGGER) private readonly _logger: ILogger
//     ) {
//     }
//
//     public async handle(event: SleepEvent): Promise<void> {
//         try {
//             // 1. Convert json sleep to object.
//             const sleep: Sleep = new Sleep().fromJSON(event.sleep)
//
//             // 2. Validate object based on create action.
//             CreateSleepValidator.validate(sleep)
//
//             // 3. Checks whether the object already has a record.
//             // If it exists, an exception of type ConflictException is thrown.
//             const sleepExist = await this._sleepRepository.checkExist(sleep)
//             if (sleepExist) throw new ConflictException('Sleep is already registered...')
//
//             // 4. Try to save the sleep.
//             // Exceptions of type RepositoryException and ValidationException can be triggered.
//             await this._sleepRepository.create(sleep)
//
//             // 5. If got here, it's because the action was successful.
//             this._logger.info(`Action for event ${event.event_name} successfully held! TOTAL: ${++this.count}`)
//         } catch (err) {
//             this._logger.warn(`An error occurred while attempting `
//                 .concat(`perform the operation with the ${event.event_name} name event. ${err.message}`)
//                 .concat(err.description ? ' ' + err.description : ''))
//         }
//     }
// }
