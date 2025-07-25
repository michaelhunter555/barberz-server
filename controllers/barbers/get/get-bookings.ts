import { Request, Response } from 'express';
import Booking from '../../../models/Booking';
import Transaction from '../../../models/Transaction';

function getStartOfWeek(date = new Date()) {
    const day = date.getDay(); // Sunday = 0, Monday = 1, ...
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)); // Monday
}

function getEndOfWeek(date = new Date()) {
    const start = getStartOfWeek(date);
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
}

export default async function (req: Request, res: Response) {
    const { barberId, page, limit, status, search } = req.query;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 10;
    const hasStatus = status ? { bookingStatus: String(status) } : {}
    const isValidQuery = typeof search === 'string' && search.length > 3;
    const query: Record<string, any> = {};

    if (isValidQuery) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
            { customerName: regex },
            { barberName: regex },
            { bookingNumber: regex },
            { bookingTime: regex },
            { bookingLocation: regex },
            { bookingDate: regex },
        ]
    }

    const baseQuery = { barberId: String(barberId), ...hasStatus, ...query }

    try {
        const bookings = await Booking.find(baseQuery)
            .skip((pageNum - 1) * limitNum).limit(limitNum);

        if (!bookings) {
            return void res.status(404).json({ error: 'No bookings found', ok: false });
        }
        const totalBookings = await Booking.countDocuments(baseQuery);
        
        res.status(200).json({
            bookings,
            currentPage: page,
            totalPages: Math.ceil(totalBookings / limitNum),
            totalBookings,
            ok: true,
        })
    } catch (err) {
        console.log(err);
        res.status(500).json({ erorr: 'An error retreiving all bookings has occured', ok: false })
    }

}