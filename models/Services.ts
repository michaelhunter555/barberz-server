import mongoose from 'mongoose';

type TService = { name: string, description: string, price: number }

export interface IBarberServices {
    barberId: mongoose.Schema.Types.ObjectId;
    service: TService[];
}

const Service = new mongoose.Schema({
    name: { type: String, required: true, },
    description: { type: String, required: true, },
    price: { type: Number, required: true, },  
})

const ServicesSchema = new mongoose.Schema({
    barberId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Barber'},
    services: [Service]
});

export default mongoose.models.Service || mongoose.model<IBarberServices>("Service", ServicesSchema);