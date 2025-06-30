import {Request, Response } from 'express';
import Booking from '../../../models/Booking';

export default async function(req: Request, res: Response) {
    const { bookingId } = req.query;

    try {
        const booking = await Booking.findById(bookingId);
        if(!booking) {
            return void res.status(404).json({ error: 'booking not found', ok: false})
        }
        res.status(200).json({ booking, ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error trying to retrieve booking', ok: false })
    }
}