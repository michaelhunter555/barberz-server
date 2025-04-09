import mongoose from "mongoose";

interface Reviews extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    shopId: mongoose.Types.ObjectId;
    reviewDate: Date;
    transactionCost: number;
    rating: number;
    userReview: string;
    barberFeedback: string;
    feedbackImage: string;
    feedbackImage2: string;
    feedbackImage3: string;
}

const ReviewSchema = new mongoose.Schema<Reviews>({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Barber', required: true },
    reviewDate: { type: Date, required: true, default: Date.now },
    transactionCost: { type: Number, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 }, // Assuming rating scale is 1-5
    userReview: { type: String, required: true },
    barberFeedback: { type: String, required: false },
    feedbackImage: { type: String, required: false },
    feedbackImage2: { type: String, required: false },
    feedbackImage3: { type: String, required: false },
});

export default mongoose.models.Review || mongoose.model<Reviews>("Reviw", ReviewSchema);