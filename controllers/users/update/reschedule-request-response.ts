import { Request, Response } from 'express';
import Booking from '../../../models/Booking';
import { io } from '../../../app';
import { Notifications } from '../../../types';
import Chat from '../../../models/Chat';
import Transaction from '../../../models/Transaction';
import Stripe from 'stripe';
import { getBookingDateTime } from '../../../util/getBookingdateAndTime';

export default async function(req: Request, res: Response) {
    const { response, bookingId, rescheduleData } = req.body;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);

    if(!response || !bookingId || !rescheduleData) {
        return void res.status(400).json({ error: 'Some or multiple fields are invalid, check your bookingId, response and reschedule object.', ok: true });
    };

    const { requestedDay, startTime, endTime } = rescheduleData;

    try {
        const booking = await Booking.findById(bookingId);
        if(!booking) {
            return void res.status(404).json({ error: 'Could not find a booking with the given id', ok: false })
        }

        if(response === 'reject') {
            booking.bookingStatus = 'canceled';
            booking.barberIsComplete = true;
            
            if(booking.initialPaymentIntentId){
                const intent = await stripe.paymentIntents.retrieve(booking.initialPaymentIntentId);
                if(intent.status === 'requires_capture') {
                    await stripe.paymentIntents.cancel(intent.id);
                    await Transaction.findByIdAndDelete({ bookingId: booking._id });
                }
            }
            await Chat.findByIdAndUpdate(booking.chatId, {
                chatIsComplete: true,
            });
        };

        if(response === 'accept') {
            booking.bookingStatus = 'confirmed';
            booking.isConfirmed = true;
            const bookingDateAndTime = getBookingDateTime(requestedDay, `${startTime}-${endTime}`);
            booking.bookingDateAndTime = bookingDateAndTime;
            booking.bookingDate = requestedDay;
            booking.bookingTime = `${startTime}-${endTime}`;

            if(booking.initialPaymentIntentId) {
                const intent = await stripe.paymentIntents.retrieve(booking.initialPaymentIntentId);
                if(intent.status === 'requires_capture') {
                    await stripe.paymentIntents.capture(intent.id);
                }
            }
        }
        
        await booking.save()
        if(String(booking.barberId)) {
            const notification = response === 'accept' ? 
            Notifications.BOOKING_RESCHEDULE_APPROVED 
            :Notifications.BOOKING_RESCHEDULE_DECLINED;

            io.to(String(booking.barberId)).emit(notification, {
                response: response,
                message: `${booking.customerName} ${response}ed your reschedule request`,
                bookingId: booking._id,
                text2: `The booking is now ${response === 'accept' ? 'confirmed' : 'canceled'}`,
            })
        }

        res.status(200).json({ bookingId: booking._id,  message: 'Request Sent!', ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: err, ok: false })
    }
}