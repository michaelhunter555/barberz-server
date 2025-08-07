import mongoose, { Mongoose } from 'mongoose';
import { TService } from './Services';



export interface IBookings extends mongoose.Document {
    bookingNumber: string;
    customerId: mongoose.Types.ObjectId; // ref: Barbers
    customerName: string;
    customerImg: string;
    barberImg: string;
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
    proofOfCompletionImg?: string;
    customerConfirmComplete: boolean;
    bookingStatus: 'pending' | 'confirmed' | 'completed' | 'canceled' | 'reschedule' | 'expired';
    hasReview?: boolean;
    reviewId: mongoose.Types.ObjectId;
    paymentType: 'onCompletion' | 'halfNow' | 'payInFull';
    cancelFee?: number;
    cancelFeeType?: 'percent' | 'number';
    serviceFee?: number;
    initialPaymentIntentId?: string;
    remainingAmount?: number;
    isAppLevelCoupon?: boolean;
    chatId?: mongoose.Types.ObjectId;
    rescheduleRequest?: {
        requestedDay: string,
        startTime: string;
        endTime: string; 
    };
    transactionId?: mongoose.Types.ObjectId;
    transactionId2?: mongoose.Types.ObjectId;
};

const BookingSchema = new mongoose.Schema<IBookings>({
    bookingNumber: { type: String, required: true, },
    transactionId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Transaction'},
    transactionId2: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Transaction'},
    chatId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Chat' },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Barber", // or "Barbers" if both are barbers
        required: true,
    },
    barberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Barber",
        required: true,
    },
    proofOfCompletionImg: { type: String, required: false},
    serviceFee: { type: Number, required: true,},
    initialPaymentIntentId: { type: String, required: false},
    remainingAmount: { type: Number, required: false},
    cancelFee: { type: Number, required: false, default: 0},
    cancelFeeType: { type: String, required: true, enum: ['percent', 'number'], default: 'number'},
    paymentType: { type: String, enum: ['onCompletion', 'halfNow', 'payInFull'], required: true,},
    hasReview: { type: Boolean, required: false, default: false},
    reviewId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Review' },
    customerName: { type: String, required: true,},
    customerImg: { type: String, required: true},
    barberName: { type: String, required: true,},
    barberImg: { type: String, required: true},
    bookingStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'canceled', 'reschedule', 'expired'],
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
        required: false,
        ref: 'Coupon'
    },
    couponAdded: {
        type: String,
        default: null,
        required: false,
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
    isAppLevelCoupon: { type: Boolean, required: false },
    rescheduleRequest: {
        requestedDay: { type: String, required: false,},
        startTime: { type: String, required: false,},
        endTime: { type: String, required: false } 
     },
}, { timestamps: true });

export default mongoose.models.Booking || mongoose.model<IBookings>("Booking", BookingSchema);