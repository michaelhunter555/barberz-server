import { Request, Response } from 'express';
import Booking, { IBookings } from '../../../models/Booking';
import { findUserById } from '../../../lib/database/findUserById';
import { io } from '../../../app';
import { Notifications } from '../../../types';
import Stripe from 'stripe';
import Transaction from '../../../models/Transaction';
import Chat from '../../../models/Chat';

export default async function(req: Request, res: Response) {
    const { bookingResponse, bookingId, customerId } = req.body;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);

    if(!['confirmed','canceled'].includes(bookingResponse)) {
        return void res.status(400).json({ error: 'Unsupported booking response', ok: false })
    }

    try {
        const booking = await Booking.findOne({ _id: bookingId });
        const user = await findUserById(String(booking?.customerId), res);
        const barber = await findUserById(String(booking?.barberId), res);

        // handle cases for 100% paid up front or half now, half later
        // booking remains in authorization state until barber confirms.
        // once the booking is (confirmed || canceled), we can take stripe action.
        if(booking.initialPaymentIntentId) {
            const intent = await stripe.paymentIntents.retrieve(booking.initialPaymentIntentId);
    
            if(bookingResponse === 'confirmed'){
                if(intent.status === 'requires_capture') {
                    await stripe.paymentIntents.capture(intent.id);
                }
            }
    
            if(bookingResponse === 'canceled') {
                if(intent.status === 'requires_capture') {
                    await stripe.paymentIntents.cancel(intent.id);
                    await Transaction.findByIdAndDelete({ bookingId: booking._id });
                }
                booking.barberIsComplete = true;
            }
        }

        if(bookingResponse === 'canceled'){
            const chat = await Chat.findOne({
                bookingId: booking._id,
            })
            chat.chatIsComplete = true;
            await chat.save();
        }

        booking.bookingStatus = bookingResponse as IBookings['bookingStatus'];
        booking.isConfirmed = bookingResponse === 'confirmed';
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
        res.status(200).json({ message: 'Booking updated to ' + bookingResponse, ok: true })
    } catch(err) {
        console.log(err)
        res.status(500).json({ error: 'Error updating booking status ' + err, ok: false })
    }


}