import mongoose from "mongoose";

interface IBarberShops extends mongoose.Document {
    name: string;
    location: string;
    isClaimed: boolean;
    ownerId: mongoose.Types.ObjectId;
    ownerName: string;
    reviews: mongoose.Types.ObjectId;
    transactions: mongoose.Types.ObjectId;
    // promos: Promotions
}

const ShopSchema = new mongoose.Schema<IBarberShops>({
    name: { type: String, required: true, },
    location: { type: String, required: true,},
    isClaimed: { type: Boolean, required: true, default: false,},
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Barber" },
    ownerName: { type: String, required: true, default: ""},
    reviews: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Review"},
    transactions: { type: mongoose.Schema.Types.ObjectId, required: false, default: "none yet"}
});

export default mongoose.models.Shop || mongoose.model<IBarberShops>("Shop", ShopSchema);