import { Request, Response } from 'express';
import Booking from '../../../models/Booking';
import Stripe from 'stripe';
import { io } from '../../../app';
import { Notifications } from '../../../types';
import Chat from '../../../models/Chat';

export default async function(req: Request, res: Response) {
    const { bookingId } = req.body;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`)

    if(!bookingId) {
        return void res.status(400).json({ error: 'Please pass a valid booking id', ok: false })
    };

    const booking = await Booking.findById(bookingId);

    if(!booking) {
        return void res.status(404).json({ error: 'Could not find a booking with the given id!', ok: false})
    }
    let result = {};
    try {
        if(booking.initialPaymentIntentId) {
            const intent = await stripe.paymentIntents.retrieve(booking.initialPaymentIntentId);
            const chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id
            
            if(chargeId) {
               const refund = await stripe.refunds.create({
                charge: chargeId,
                reason: 'requested_by_customer'
               })
               result = refund;
            }
        }
        booking.bookingStatus = 'canceled';
        booking.barberIsComplete = true;
        booking.barberIsStarted = true;
        booking.barberCompleteTime = new Date();

        
        const chat = await Chat.findOne({
            bookingId: booking._id,
        })
        chat.chatIsComplete = true;
        await chat.save();

        await booking.save();

        try {
            io.to(String(booking.customerId)).emit(Notifications.BOOKING_CANCELLED_BY_BARBER, {
                message: 'The booking has been cancelled',
                action: "Payment method has been refunded."
            })
        } catch(err) {
            console.log("IO error: ", err);
        }

        res.status(200).json({ result, ok: true});
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: err, ok: false })
    }

}