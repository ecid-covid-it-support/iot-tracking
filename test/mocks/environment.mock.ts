import { Environment } from '../../src/application/domain/model/environment'
import { Location } from '../../src/application/domain/model/location'
import { Measurement, MeasurementType } from '../../src/application/domain/model/measurement'
import { Temperature } from '../../src/application/domain/model/temperature'
import { Humidity } from '../../src/application/domain/model/humidity'

export class EnvironmentMock extends Environment {

    constructor() {
        super()
        this.generateEnvironment()
    }

    private generateEnvironment(): void {
        super.id = this.generateObjectId()
        super.institution_id = this.generateObjectId()
        super.timestamp = new Date()
        super.climatized = (Math.random() >= 0.5)
        super.temperature = this.generateTemp()
        super.humidity = this.generateHumi()
        super.location = new Location().fromJSON({
            local: 'Indoor',
            room: 'room 01',
            latitude: Math.random() * 90,
            longitude:  Math.random() * 180
        })
    }

    private generateTemp(): Measurement {
        const measurement: Measurement = new Temperature()
        measurement.type = MeasurementType.TEMPERATURE
        measurement.value = Math.random() * 13 + 19 // 19-31
        measurement.unit = '°C'

        return measurement
    }

    private generateHumi(): Measurement {
        const measurement: Measurement = new Humidity()
        measurement.type = MeasurementType.HUMIDITY
        measurement.value = Math.random() * 16 + 30 // 30-45
        measurement.unit = '%'

        return measurement
    }

    private generateObjectId(): string {
        const chars = 'abcdef0123456789'
        let randS = ''
        for (let i = 0; i < 24; i++) {
            randS += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return randS
    }
}
