import mongoose from "mongoose";

interface Reviews extends mongoose.Document {
    bookingId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userName: string;
    userImg: string;
    barberId: mongoose.Types.ObjectId;
    reviewDate: Date;
    serviceDate: Date;
    transactionCost?: number;
    rating: number;
    punctualityRating: number;
    cleanlinessRating: number;
    overallRating: number;
    userReview?: string;
    barberFeedback: string;
    imageOne?: string;
    imageTwo?: string;
    imageThree?: string;
}

const ReviewSchema = new mongoose.Schema<Reviews>({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Barber', required: true },
    userName: { type: String, required: true, },
    userImg: { type: String, required: false},
    barberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Barber', required: true },
    reviewDate: { type: Date, required: true, default: Date.now },
    serviceDate: { type: Date, required: true, default: Date.now },
    transactionCost: { type: Number, required: false, default: 0 },
    rating: { type: Number, required: true, min: 1, max: 5 }, // Assuming rating scale is 1-5
    punctualityRating: { type: Number, required: true, min: 1, max: 5 }, 
    cleanlinessRating: { type: Number, required: true, min: 1, max: 5 }, 
    overallRating: { type: Number, required: true, min: 1, max: 5 }, 
    userReview: { type: String, required: false, default: "" },
    barberFeedback: { type: String, required: false },
    imageOne: { type: String, required: false },
    imageTwo: { type: String, required: false },
    imageThree: { type: String, required: false },
});

export default mongoose.models.Review || mongoose.model<Reviews>("Review", ReviewSchema);