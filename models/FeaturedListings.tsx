import mongoose from 'mongoose';

interface IFeaturedListing extends mongoose.Document {
    userId: mongoose.Schema.Types.ObjectId;
    shopName: string;
    RatingsAverage: number;
    startDate: Date;
}

const FeaturedSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, isRequired: true, },
    shopName: { type: String, required: true, }
})