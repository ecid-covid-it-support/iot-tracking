import mongoose, { Document } from 'mongoose'
/**
 * Interface Activity
 * 
 * @author Lucas Rocha <lucas.rocha@nutes.uepb.edu.br>
 * @version 1.0
 * @copyright Copyright (c) 2018, NUTES/UEPB. 
 */
export interface IActivity extends Document {
    id?: string
    user_id: string
    name: string
    location?: string
    start_time: Date
    end_time?: Date
    duration: number
    intensity_level: string
    max_intensity?: string
    max_intensity_duration?: string
    distance?: number
    calories: number
    steps: number
    create_at?: Date
}

/**
 * Schema of Activity.
 */
const activitySchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: 'Id of User is required!'
    },
    name: {
        type: String,
        required: 'Name of activity is required!'
    },
    location: { type: String },
    start_time: {
        type: Date,
        required: "Activity start time is required!",
    },
    end_time: { type: Date },
    duration: {
        type: Number,
        required: 'Duration of activity is required!'
    },
    intensity_level: {
        type: String,
        required: 'Intensity level of activity is required!'
    },
    max_intensity: { type: String },
    max_intensity_duration: { type: Number },
    distance: { type: Number },
    calories: {
        type: Number,
        required: 'Calories spent during activity is required!'
    },
    steps: {
        type: Number,
        required: 'Number of steps taken during the activity is required!'
    }
},
    {
        timestamps: { createdAt: 'created_at' }
    }
)

activitySchema.pre('save', (next) => {
    // this will run before saving 
    next()
})

activitySchema.index({ user_id: 1, start_time: 1 }, { unique: true })

export const Activity = mongoose.model<IActivity>('Activity', activitySchema)