import mongoose from 'mongoose';

export type TService = { name: string, description: string, price: number }

export interface IBarberServices extends mongoose.Document {
    barberId: mongoose.Schema.Types.ObjectId;
    services: TService[];
}

const Service = new mongoose.Schema<TService>({
    name: { type: String, required: true, },
    description: { type: String, required: true, },
    price: { type: Number, required: true, },  
})

const ServicesSchema = new mongoose.Schema<IBarberServices>({
    barberId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Barber'},
    services: [Service]
}, {timestamps: true });

export default mongoose.models.Service || mongoose.model<IBarberServices>("Service", ServicesSchema);