import mongoose from 'mongoose';
import { TService } from './Services';

export interface IBookings extends mongoose.Document {
    bookingNumber: number;
    customerId: mongoose.Types.ObjectId; // ref: Barbers
    customerName: string;
    customerImg: string;
    barberName: string;
    barberId: mongoose.Types.ObjectId; // ref: Barbers
    bookingDate: string;
    bookingTime: string;
    bookingLocation: string;
    bookingDateAndTime: Date;
    isConfirmed: boolean;
    addOns: TService[];
    price: number;
    discount?: number;
    discountId?: mongoose.Types.ObjectId;
    couponAdded?: string;
    tip?: number;
    platformFee: number;
    barberIsStarted: boolean;
    barberStartTime: string;
    barberIsComplete: boolean;
    barberCompleteTime: string;
    customerConfirmComplete: boolean;
    bookingStatus: 'pending' | 'confirmed' | 'completed' | 'canceled' | 'reschedule';
};

const BookingSchema = new mongoose.Schema<IBookings>({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Barbers", // or "Barbers" if both are barbers
        required: true,
    },
    barberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Barbers",
        required: true,
    },
    customerName: { type: String, required: true,},
    customerImg: { type: String, required: true},
    barberName: { type: String, required: true,},
    bookingStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'canceled', 'reschedule'],
        required: true,
    },
    isConfirmed: {
        type: Boolean,
        required: true,
        default: false,
    },
    bookingDate: {
        type: String,
        required: true,
    },
    bookingTime: {
        type: String,
        required: true,
    },
    bookingLocation: {
        type: String,
        required: true,
    },
    bookingDateAndTime: {
        type: Date,
        required: true,
    },
    addOns: {
        type: [
          {
            name: { type: String, required: true },
            description: { type: String, required: true },
            price: { type: Number, required: true },
          }
        ],
        default: [],
        required: false, // fixed typo: "requried" ➝ "required"
      },
    price: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
        required: false,
    },
    discountId: {
        type: mongoose.Schema.Types.ObjectId,
        requried: false,
        ref: 'Coupon'
    },
    couponAdded: {
        type: String,
        default: null,
        requried: false,
    },
    tip: {
        type: Number,
        default: 0,
        required: false
    },
    platformFee: {
        type: Number,
        required: true,
    },
    barberIsStarted: {
        type: Boolean,
        default: false,
    },
    barberStartTime: {
        type: String,
        default: "",
    },
    barberIsComplete: {
        type: Boolean,
        default: false,
    },
    barberCompleteTime: {
        type: String,
        default: "",
    },
    customerConfirmComplete: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export default mongoose.models.Booking || mongoose.model<IBookings>("Booking", BookingSchema);