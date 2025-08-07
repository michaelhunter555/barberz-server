import mongoose from "mongoose";

export interface ITransaction extends mongoose.Document {
  bookingNumber: string; // not unique per transaction anymore
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  barberId: mongoose.Types.ObjectId;
  stripePaymentIntentId: string;
  stripeCustomerId: string;
  amountCharged: number;
  amountPaid: number;
  amountRemaining: number;
  // deposit is 1/2 with halfnow
  // typeof payment 'final' is for onCompletion and 2/2 of halfnow
  // full is payInFull
  paymentType: 'deposit' | 'final' | 'full' | 'refund';
  billingReason: string;
  paymentStatus?: 'succeeded' | 'failed' | 'canceled' | 'pending';
  chargeId?: string;
  currency?: string;
  invoiceUrl?: string;
  couponId?: mongoose.Schema.Types.ObjectId;
  couponApplied?: boolean;
  serviceFee: number;
  hasDispute?: boolean;
  disputeStartDate?: Date | string;
  disputeId?: mongoose.Schema.Types.ObjectId;
  paidOut?: boolean;
  payoutDate?: Date;
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
  paymentStatus: { type: String, enum: ['succeeded', 'failed', 'canceled', 'pending'], required: false},
  billingReason: { type: String, required: false, default: "" },
  currency: { type: String, required: false, default: "usd" },
  invoiceUrl: { type: String, required: false, default: "" },
  couponApplied: { type: Boolean, required: false, default: false },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: false },
  hasDispute: { type: Boolean, required: false, defualt: false},
  disputeStartDate: { type: Date, required: false, },
  disputeId: { type: mongoose.Schema.Types.ObjectId, required: false},
  paidOut: { type: Boolean, required: false, default: false },
  payoutDate: { type: Date, required: false,}
}, { timestamps: true });

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
