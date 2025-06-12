import { Request, Response } from 'express';
import Booking from '../../../models/Booking';

export default async function(req: Request, res: Response) {
    const { barberId, page, limit } = req.query;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 10;

    try {
        const bookings = await Booking.find({ barberId: String(barberId) })
        .skip((pageNum - 1) * limitNum).limit(limitNum);

        if(!bookings) {
            return void res.status(404).json({ error: 'No bookings found', ok: false });
        }
        const totalBookings = await Booking.countDocuments({ barberId: String(barberId) });
        res.status(200).json({
            bookings,
            currentPage: page,
            totalPages: Math.ceil(totalBookings/limitNum),
            totalBookings,
            ok: true,
        })
    } catch(err) {
        res.status(500).json({ erorr: 'An error retreiving all bookings has occured', ok: false })
    }

}