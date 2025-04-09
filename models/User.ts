import mongoose from "mongoose";
/**
 * DO NOT USE THIS FILE - DEPRECATED
 */
export interface User extends mongoose.Document {
    name: string;
    email: string;
    appleId: string;
    geoLocation: string;
    location: string;
    accountType: "user" | "barber";
    userIsLive: boolean;
}

const UserSchema = new mongoose.Schema<User>({
    name: { type: String, required: true, },
    email: { type: String, required: true, },
    appleId: { type: String, required: true, },
    geoLocation: { type: String, required: true, },
    location: { type: String, required: true, },
    accountType: { type: String, required: true, enum: ["user", "barber"]},
    userIsLive: { type: Boolean, required: true, default: false }
})

export default mongoose.models.User || mongoose.model<User>("User", UserSchema)