import { Request, Response } from 'express';
import Booking, { IBookings } from '../../../models/Booking';
import { findUserById } from '../../../lib/database/findUserById';
import { io } from '../../../app';
import { Notifications } from '../../../types';

export default async function(req: Request, res: Response) {
    const { bookingResponse, bookingId, customerId } = req.body;

    try {
        const booking = await Booking.findOne({ _id: bookingId });
        const user = await findUserById(String(booking?.customerId), res);
        const barber = await findUserById(String(booking?.barberId), res);
       booking.bookingStatus = bookingResponse as IBookings['bookingStatus'];
       await booking.save();
    
    
        if(user){
            io.to(String(user?._id)).emit(Notifications.BARBER_APPOINTMENT_RESPONSE, {
                booking,
                message: `${barber?.name} ${
                                bookingResponse === 'confirmed' 
                                ? 'confirmed'
                                : bookingResponse === 'canceled'
                                ? 'could not accept'
                                : bookingResponse === 'reschedule'
                                ? 'wants to reschedule': 'responded to'
                            } your booking`,
            })
        }
        // "pending" | "confirmed" | "completed" | "canceled" | "reschedule"
        if(bookingResponse === 'confirmed'){
            console.log('barber has accepted your booking');
            
        } else if( bookingResponse === 'canceled') {
            console.log('barber chose not to accept this booking.');
    
        } else if(bookingResponse === 'reschedule') {
            console.log('barber is asking to reschedule.');
        }

        res.status(200).json({ message: 'Booking updated to ' + bookingResponse, ok: true })
    } catch(err) {
        console.log(err)
        res.status(500).json({ error: 'Error updating booking status ' + err, ok: false })
    }


}