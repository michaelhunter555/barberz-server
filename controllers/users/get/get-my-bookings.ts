import { Request, Response } from 'express';
import Booking from '../../../models/Booking';

export default async function(req: Request, res: Response) {
    const {userId, page, limit, status } = req.query;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 10;
    const hasStatus = status ? { bookingStatus: String(status) } : {}

    try {
        const bookings = await Booking.find({ customerId: String(userId), ...hasStatus })
        .skip((pageNum - 1) * limitNum).limit(limitNum);

        if(!bookings) {
            return void res.status(404).json({ error: 'No bookings found', ok: false });
        }
        const totalBookings = await Booking.countDocuments({ customerId: String(userId), ...hasStatus });
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