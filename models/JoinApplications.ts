import mongoose from 'mongoose';

export interface IJoinAgreements extends mongoose.Document {
    userId: string,
    email: string;
    name: string;
    date: Date;
    location: string;
    isLicensed: boolean;
    isOnDemand: boolean;
    didSign: boolean;
    signature: string;
    termsApproved: boolean;
    imageIdFront: string;
    imageIdBack: string;
};

const JoinAgreementSchema = new mongoose.Schema<IJoinAgreements>({
    userId: { type: String, required: true, },
    email: { type: String, required: true,},
    name: { type: String, required: true, },
    date: { type: Date, required: true, default: Date.now()},
    isLicensed: { type: Boolean, required: true, default: false },
    isOnDemand: { type: Boolean, required: true, default: false },
    termsApproved: { type: Boolean, required: true, default: false },
    signature: { type: String, required: true, },
    imageIdFront: { type: String, required: true},
    imageIdBack: { type: String, required: true },
});

export default mongoose.models.Join || mongoose.model<IJoinAgreements>("JoinApplication", JoinAgreementSchema);