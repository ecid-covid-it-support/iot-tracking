import { ActivityEntity } from './activity.entity'

export class PhysicalActivityEntity extends ActivityEntity {
    public name?: string // Name of physicalactivity.
    public calories?: number // Calories spent during physicalactivity.
    public steps?: number // Number of steps taken during the physicalactivity.
    public distance?: number // Distance traveled during the physicalactivity.
    public levels?: Array<any> // PhysicalActivity levels (sedentary, light, fair or very).
    public heart_rate?: any // PhysicalActivity heart rate.
}
