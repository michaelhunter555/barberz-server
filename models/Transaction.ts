import mongoose from "mongoose";

export interface ITransaction extends mongoose.Document {
  bookingNumber: string; // not unique per transaction anymore
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  barberId: mongoose.Types.ObjectId;
  stripePaymentIntentId: string;
  stripeCustomerId: string;
  chargeId?: string;
  amountCharged: number;
  amountPaid: number;
  amountRemaining: number;
  paymentType: 'deposit' | 'final' | 'full' | 'refund';
  billingReason: string;
  currency?: string;
  invoiceUrl?: string;
  couponId?: mongoose.Schema.Types.ObjectId;
  couponApplied?: boolean;
  serviceFee: number;
}

const TransactionSchema = new mongoose.Schema<ITransaction>({
  bookingNumber: { type: String, required: true }, // shared across related txns
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Barber", required: true },
  barberId: { type: mongoose.Schema.Types.ObjectId, ref: "Barber", required: true },
  stripePaymentIntentId: { type: String, required: true },
  stripeCustomerId: { type: String, required: true },
  serviceFee: { type: Number, required: true,},
  chargeId: { type: String, required: false },
  amountCharged: { type: Number, required: true },
  amountPaid: { type: Number, required: true },
  amountRemaining: { type: Number, required: false, default: 0 },
  paymentType: { type: String, enum: ['deposit', 'final', 'full', 'refund'], required: true },
  billingReason: { type: String, required: false, default: "" },
  currency: { type: String, required: false, default: "usd" },
  invoiceUrl: { type: String, required: false, default: "" },
  couponApplied: { type: Boolean, required: false, default: false },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: false }
}, { timestamps: true });

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
