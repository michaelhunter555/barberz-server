import mongoose from 'mongoose';

type THourSlot = { value: number; hour: number; minute: number };

export interface IDaySlot { 
    _id?: mongoose.Types.ObjectId, 
    startTime: THourSlot, 
    endTime: THourSlot, 
    price: number, 
    isBooked: boolean; 
}

export interface IScheduleByDay {
    [day: string]: IDaySlot[]
}

export interface IHours extends mongoose.Document {
        barberId:  mongoose.Schema.Types.ObjectId;
        schedule: IScheduleByDay
};

const TimeSchema = new mongoose.Schema<THourSlot>({
    hour: { type: Number, required: true },
    minute: { type: Number, required: true, enum: [0, 15, 30, 45] },
    value: { type: Number, required: true },
  }, { _id: false });

  const DaySlotSchema = new mongoose.Schema<IDaySlot>({
    startTime: { type: TimeSchema, required: true },
    endTime: { type: TimeSchema, required: true },
    price: { type: Number, required: true },
    isBooked: { type: Boolean, default: false },
  });

  const ScheduleSchema = new mongoose.Schema<IScheduleByDay>({
    monday: [DaySlotSchema],
    tuesday: [DaySlotSchema],
    wednesday: [DaySlotSchema],
    thursday: [DaySlotSchema],
    friday: [DaySlotSchema],
    saturday: [DaySlotSchema],
    sunday: [DaySlotSchema],
  }, { _id: false });

const HoursSchema = new mongoose.Schema<IHours>({
    barberId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Barber'},
    schedule: { type: ScheduleSchema, default: {} }
})

export default mongoose.models.Hour || mongoose.model<IHours>("Hour", HoursSchema);