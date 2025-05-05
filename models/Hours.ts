import mongoose from 'mongoose';

type THourSlot = { value: number; hour: number; minute: number };

export interface IHourSlot  { 
    day: string, 
    startTime: THourSlot, 
    endTime: THourSlot, 
    price: number, 
    isBooked: boolean; 
}

export interface IHours extends mongoose.Document {
        barberId:  mongoose.Schema.Types.ObjectId;
        slots: IHourSlot[]
};

const HoursSlotSchema = new mongoose.Schema({
    day: { type: String, required: true, },
    startTime: {
        hour: { type: Number, required: true },
    minute: { type: Number, required: true, enum: [0, 15, 30, 45] },
    value: { type: Number, required: true },
    },
    endTime: {
        hour: { type: Number, required: true },
    minute: { type: Number, required: true, enum: [0, 15, 30, 45] },
    value: { type: Number, required: true },
    },
    price: { type: Number, required: true,},
    isBooked: { type: Boolean, isRequired: false, default: false,}
})

const HoursSchema = new mongoose.Schema({
    barberId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Barber'},
    slot: [HoursSlotSchema]
})

export default mongoose.models.Hour || mongoose.model<IHours>("Hour", HoursSchema);