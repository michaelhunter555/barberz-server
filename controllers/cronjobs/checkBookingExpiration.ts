import { Request, Response } from 'express';
import Booking from '../../models/Booking';
import Stripe from 'stripe';
import Transaction from '../../models/Transaction';

export default async function() {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const date = new Date(Date.now() - sevenDays);
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);

    try {
        const bookings = await Booking.find({
            createdAt: { $lte: date },
            bookingStatus: 'pending',
            $or: [
                {paymentType: 'halfNow'},
                {paymentType: 'payInFull'}
            ]
        });

        if (bookings.length === 0) {
            console.log('Cron Complete: No bookings to expire');
            return;
          }
          
      const ids = bookings.map((booking) => booking._id);

      await Booking.updateMany(
        { _id: { $in: ids } },
        { $set: { bookingStatus: 'expired' }}
    )

      await Promise.all(
            bookings.map( async (booking) => {
               const stripePaymentIntent = await stripe.paymentIntents.retrieve(String(booking.initialPaymentIntentId));
               if(stripePaymentIntent.status === 'requires_capture') {
                await stripe.paymentIntents.cancel(stripePaymentIntent.id);
               }
            })
        );

        await Transaction.updateMany(
            { bookingId: { $in: ids } },
            { $set: { amountCharged: 0, paymentType: 'final' } }
          );

        console.log("Cron Complete");
    } catch(err) {
        console.log("Cron Error: ", err);
    }
}