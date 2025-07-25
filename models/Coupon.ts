import mongoose from "mongoose";

interface ICoupon extends mongoose.Document {
    name: string;
    ownerId: mongoose.Types.ObjectId;
    isPublic: boolean;
    isActive: boolean;
    transactionComplete: boolean;
    amount: number;
    amountType: 'percent' | 'amount';
    terms: string;
    minPriceActivation: number;
    expirationDate: String;
    transactions: number;
    onlyForUsers?: [mongoose.Types.ObjectId];
    isAppLevel?: boolean;
}

const CouponSchema = new mongoose.Schema<ICoupon>({
    name: { type: String, required: true, },
    ownerId: { type: mongoose.Schema.Types.ObjectId, requird: true, ref: "Barber"},
    isPublic: { type: Boolean, required: false, default: true },
    isActive: { type: Boolean, required: false, default: false },
    amount: { type: Number, required: true, },
    amountType: { type: String, enum: ['percent','amount'], required: true, default: 'amount'},
    terms: { type: String, required: true,},
    minPriceActivation: { type: Number, required: true, },
    expirationDate: { type: String, required: true, },
    transactions: { type: Number, required: true, defualt: 0},
    transactionComplete: { type: Boolean, required: false, default: false},
    onlyForUsers: { type: [mongoose.Schema.Types.ObjectId], required: false, ref: "Barber"},
    isAppLevel: { type: Boolean, required: false, default: false }
}, { timestamps: true });

export default mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);