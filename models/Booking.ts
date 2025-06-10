import mongoose from 'mongoose';

interface IBookings extends mongoose.Document {
    customerId: mongoose.Types.ObjectId; // ref: Barbers
    barberId: mongoose.Types.ObjectId; // ref: Barbers
    bookingDateAndTime: string;
    bookingLocation: string;
    addOns: string[];
    price: number;
    discount?: number;
    couponAdded?: string;
    tip?: number;
    platformFee: number;
    barberIsStarted: boolean;
    barberStartTime: string;
    barberIsComplete: boolean;
    barberCompleteTime: string;
    customerConfirmComplete: boolean;
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
    bookingDateAndTime: {
        type: String,
        required: true,
    },
    bookingLocation: {
        type: String,
        required: true,
    },
    addOns: {
        type: [String],
        default: [],
    },
    price: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    },
    couponAdded: {
        type: String,
        default: null,
    },
    tip: {
        type: Number,
        default: 0,
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