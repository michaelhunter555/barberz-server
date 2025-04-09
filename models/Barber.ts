import mongoose from "mongoose";

export type Services = {
    serviceType: string;
    price: number;
    description: string;
};

export type Status = 'Available' | "Busy" | "Away";

export interface IBarber extends mongoose.Document {
    name: string;
    email: string;
    image?: string;
    imageOne?: string;
    imageTwo?: string;
    imageThree?: string;
    imageFour?: string;
    imageFive?: string;
    appleId?: string;
    geoLocation?: string;
    location?: string;
    userIsLive?: boolean;
    shopName?: string;
    services?: Services[] | [];
    isAvailable?: boolean;
    status?: Status;
    startingPrice?: number;
    hours?: string;
    avgReviewScore?: number;
    totalReviews?: number;
    reviews?: mongoose.Types.ObjectId[];
    transactions?: mongoose.Types.ObjectId[];
    requestedBooking?: number;
    customerBookings?: mongoose.Types.ObjectId[];
    hasActiveDeal?: boolean;
    accountType?: 'user' | 'barber',
    shops?: mongoose.Types.ObjectId[]
};

const BarberSchema = new mongoose.Schema<IBarber>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    image: { type: String, required: true },
    imageOne: { type: String, required: false },
    imageTwo: { type: String, required: false },
    imageThree: { type: String, required: false },
    imageFour: { type: String, required: false },
    imageFive: { type: String, required: false },
    appleId: { type: String, required: false },
    geoLocation: { type: String, required: false, },
    location: { type: String, required: false, },
    userIsLive: { type: Boolean, required: true, default: false },
    shopName: { type: String, required: false },
    services: [{
        serviceType: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String, required: true },
    }],
    isAvailable: { type: Boolean, required: true, default: true },
    status: { type: String, enum: ['Available', 'Busy', 'Away'], required: true, default: "Busy" },
    startingPrice: { type: Number, required: false, default: 0 },
    hours: { type: String, required: false, },
    avgReviewScore: { type: Number, required: true, default: 0 },
    totalReviews: { type: Number, required: true, default: 0 },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
    requestedBooking: { type: Number, required: true, default: 0 },
    customerBookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
    hasActiveDeal: { type: Boolean, required: true, default: false },
    shops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop'}]
});


export default mongoose.models.Barber || mongoose.model<IBarber>("Barber", BarberSchema);