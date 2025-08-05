import mongoose from "mongoose";

export interface IStrikeActions {
    userId: mongoose.Types.ObjectId;
    bookingId: mongoose.Types.ObjectId;
    userName: string;
    accountType: string;
    strikeDate: Date;
    reason: 
    |'canceled_confirmed_booking' 
    | 'customer_behavoir' 
    | 'barber_behavoir' 
    | 'circumventing_systems_and_procedures' 
    | 'barber_no_show';
    explanation?: string;
    penaltyAmount?: number;
}

const StrikeSchema = new mongoose.Schema<IStrikeActions>({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Barber' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Booking' },
    userName: { type: String, required: true, },
    accountType: { type: String, required: true },
    strikeDate: { type: Date, required: true, default: Date.now()},
    reason: { type: String, required: true, enum: [ 
        'canceled_confirmed_booking', 
         'customer_behavoir', 
         'barber_behavoir', 
         'circumventing_systems_and_procedures', 
         'barber_no_show',]},
    explanation: { type: String, required: false, },
    penaltyAmount: { type: Number, required: false, default: 0}
}, {timestamps: true})

export default mongoose.models.Strike || mongoose.model<IStrikeActions>("Strike", StrikeSchema);