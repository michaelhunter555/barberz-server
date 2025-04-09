import mongoose from 'mongoose';

interface IMessage extends mongoose.Document {
    message: string;
    time: Date;
    userName: mongoose.Schema.Types.ObjectId,
    userRecipient: mongoose.Schema.Types.ObjectId,
    transaction: mongoose.Schema.Types.ObjectId,
};

const MessageSchema = new mongoose.Schema<IMessage>({
    message: { type: String, required: true, },
    time: { type: Date, required: true, default: Date.now()},
    userName: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Barber"},
    userRecipient: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Barber"},
    transaction: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Transaction"}
});

export default mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema)