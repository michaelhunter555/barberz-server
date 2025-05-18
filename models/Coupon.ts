import mongoose from "mongoose";

interface ICoupon extends mongoose.Document {
    ownerId: mongoose.Types.ObjectId;
    isPublic: boolean;
    isActive: boolean;
    transactionComplete: boolean;
    amount: number;
    terms: string;
    minPriceActivation: number;
    expirationDate: Date;
    transactions: number;
    onlyForUsers?: [mongoose.Types.ObjectId];
}

const CouponSchema = new mongoose.Schema<ICoupon>({
    ownerId: { type: mongoose.Schema.Types.ObjectId, requird: true, ref: "Barber"},
    isPublic: { type: Boolean, required: false, default: true },
    isActive: { type: Boolean, required: false, default: false },
    amount: { type: Number, required: true, },
    terms: { type: String, required: true,},
    minPriceActivation: { type: Number, required: true, },
    expirationDate: { type: Date, required: true, },
    transactions: { type: Number, required: true, defualt: 0},
    transactionComplete: { type: Boolean, required: false, default: false},
    onlyForUsers: { type: [mongoose.Schema.Types.ObjectId], required: false, ref: "Barber"},
});

export default mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);