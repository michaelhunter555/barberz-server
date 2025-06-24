import mongoose from "mongoose";

export type Services = {
    serviceType: string;
    price: number;
    description: string;
};

export type Status = 'Available' | "Busy" | "Away";
export type LicenseInfo = {
  name: string;
  city: string;
  state: string;
  zip: number;
  expiration: string | Date;
  category: string;
  registrationNumber: number;
}

export interface IBarber extends mongoose.Document {
    name: string;
    email: string;
    bio?: string;
    isVerified?: boolean;
    userLicense?: LicenseInfo;
    myBookings?: mongoose.Types.ObjectId[];
    userHasActiveBooking?: boolean;
    image?: string;
    imageOne?: string;
    imageTwo?: string;
    imageThree?: string;
    imageFour?: string;
    imageFive?: string;
    imageSix?: string;
    appleId?: string;
    geoLocation?: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
      };
    location?: string;
    isVisible?: boolean;
    userIsLive?: boolean;
    shopName?: string;
    services?: mongoose.Types.ObjectId[]
    isAvailable?: boolean;
    status?: Status;
    startingPrice?: number;
    hours?: mongoose.Types.ObjectId[];
    avgReviewScore?: number;
    totalReviews?: number;
    reviews?: mongoose.Types.ObjectId[];
    transactions?: mongoose.Types.ObjectId[];
    requestedBooking?: number;
    customerBookings?: mongoose.Types.ObjectId[];
    hasActiveDeal?: boolean;
    accountType?: 'user' | 'barber',
    shops?: mongoose.Types.ObjectId[];
    coupons?: mongoose.Types.ObjectId[];
    myCoupons?: mongoose.Types.ObjectId[];
    primaryLocation?: string;
    otherLocations?: string[];
    stripeCustomerId: string;
    stripeAccountId: string;
};

const BarberSchema = new mongoose.Schema<IBarber>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    bio: { type: String, required: false,},
    isVerified: { type: Boolean, required: true, default: false },
    isVisible: { type: Boolean, required: true, default: false,},
    primaryLocation: { type: String, required: false, default: ""},
    otherLocations: [{type: String, required: false, default: ""}],
    stripeAccountId: { type: String, required: false, default: ""},
    stripeCustomerId: { type: String, required: false, default: ""},
    userLicense: {
      name: { type: String, required: true, },
      state: { type: String, required: true, },
      city: { type: String, required: true, },
      zip: { type: Number, required: true, },
      expiration: { type: String, required: true,},
      category: { type: String, required: true, },
      registrationNumber: { type: Number, required: true,}
    },
    image: { type: String, required: true },
    imageOne: { type: String, required: false },
    imageTwo: { type: String, required: false },
    imageThree: { type: String, required: false },
    accountType: { type: String, required: true, enum: ["user", "barber"], default: "user"},
    imageFour: { type: String, required: false },
    imageFive: { type: String, required: false },
    imageSix: { type: String, required: false },
    appleId: { type: String, required: false },
    geoLocation: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true
        }
      },
    location: { type: String, required: false, },
    userIsLive: { type: Boolean, required: true, default: false },
    shopName: { type: String, required: false },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: false }],
    isAvailable: { type: Boolean, required: true, default: true },
    status: { type: String, enum: ['Available', 'Busy', 'Away'], required: true, default: "Busy" },
    startingPrice: { type: Number, required: false, default: 0 },
    hours:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Hour'}],
    avgReviewScore: { type: Number, required: true, default: 0 },
    totalReviews: { type: Number, required: true, default: 0 },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Review' }],
    transactions: [{ type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Transaction' }],
    myBookings: [{ type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Booking'}],
    requestedBooking: { type: Number, required: true, default: 0 },
    customerBookings: [{ type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Booking' }],
    hasActiveDeal: { type: Boolean, required: true, default: false },
    shops: [{ type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Shop'}],
    coupons: [{ type: mongoose.Schema.Types.ObjectId, required: false, ref: "Coupon"}],
    myCoupons: [{ type: mongoose.Schema.Types.ObjectId, required: false, ref: "Coupon"}]
}, { timestamps: true });

BarberSchema.index({ geoLocation: '2dsphere' });


export default mongoose.models.Barber || mongoose.model<IBarber>("Barber", BarberSchema);