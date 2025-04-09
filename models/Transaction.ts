import mongoose from "mongoose";

export interface Transaction extends mongoose.Document {
  stripeCustomerId: string;
  amountPaid: number;
  billingReason: string;
  chargeId: string;
  periodEnd: number;
  periodStart: number;
  invoiceUrl?: string;
  currency?: string;
}

const TransactionSchema = new mongoose.Schema<Transaction>({
  stripeCustomerId: {
    type: String,
    required: true,
    ref: "Google",
  },
  amountPaid: { type: Number, required: false, default: 0 },
  billingReason: { type: String, required: false, default: "" },
  chargeId: { type: String, required: false, default: "" },
  periodEnd: { type: Number, required: false, default: 0 },
  periodStart: { type: Number, required: false, default: 0 },
  invoiceUrl: { type: String, required: false, default: "" },
  currency: { type: String, required: false, default: "usd" },
});

export default mongoose.models.Transaction ||
  mongoose.model<Transaction>("Transaction", TransactionSchema);