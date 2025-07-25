import { Request, Response } from 'express';
import Transaction from '../../../models/Transaction';
import Booking from '../../../models/Booking';

function getStartOfWeek(date = new Date()) {
    const day = date.getDay(); // Sunday = 0, Monday = 1, ...
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)); // Monday
}

function getEndOfWeek(date = new Date()) {
    const start = getStartOfWeek(date);
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
}

export default async function(req: Request, res: Response) {
    const { barberId } = req.query;

    if(!barberId) {
        return void res.status(400).json({ error: 'Please pass a valid barberId string', ok: false })
    }

    try {
        const startOfWeek = getStartOfWeek();
        startOfWeek.setHours(0, 0, 0, 0);
    
        const endOfWeek = getEndOfWeek();
    
        const transactions = await Transaction.find({
            barberId: String(barberId),
            createdAt: { $gte: startOfWeek, $lte: endOfWeek },
        });
    
        let transactionData: { day: number; value: number }[] = Array.from({ length: 7 }, (_, i) => ({
            day: i, 
            value: 0,
        }));
    
        if (transactions && transactions.length > 0) {
            transactions.forEach((transaction) => {
                const day = new Date(transaction.createdAt).getDay(); // 0-6
                
                const amountPaidInCents = Number(transaction.amountPaid);
                const serviceFeeInDollars = Number(transaction.serviceFee || 0);
                const serviceFeeCents = Math.round(serviceFeeInDollars * 100);

                const newAmountInCents = amountPaidInCents - serviceFeeCents;

                transactionData[day].value += newAmountInCents;
            });
        }
    
        const totalUnconfirmed = await Booking.countDocuments({ barberId: barberId, bookingStatus: 'pending' });

        res.status(200).json({ transactionData, totalUnconfirmed, ok: true });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error getting transation peformance', ok: false })
    }    

}