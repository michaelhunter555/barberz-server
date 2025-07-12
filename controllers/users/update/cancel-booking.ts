import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking from '../../../models/Booking';
import User from '../../../models/Barber'; // <- intentional
import Transaction from '../../../models/Transaction';
import Stripe from 'stripe';
import { io } from '../../../app';
import { Notifications } from '../../../types';

export default async function(req: Request, res: Response) {
    const platformFee = Number(process.env.PLATFORM_FEE);
    const { bookingId, barberId, customerId } = req.body;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);

    if(!bookingId || bookingId === 'undefined'){
        return void res.status(400).json({ error: 'Please use a valid bookingId', ok: false })
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [booking, barber, user] = await Promise.all([
            Booking.findById(bookingId),
            User.findById(barberId),
            User.findById(customerId),
        ])

        if(!booking || !barber || !user) {
            throw new Error('There was an error finding the booking, user and provider.')
        }

        if(booking.bookingStatus === 'confirmed' && booking.paymentType === 'onCompletion' && booking.cancelFee > 0) {
            const { cancelFee, cancelFeeType, price } = booking;
            const isNumberAmount = cancelFeeType === 'number';
            let cancelFeeAmount: number = 0;

            if(isNumberAmount && cancelFee <= price) {
                cancelFeeAmount = Math.round((price * 100) - (cancelFee * 100));
            }

            if(!isNumberAmount) {
                cancelFeeAmount = Math.round((price * 100) * (cancelFee / 100));
            }

            const customer = await stripe.customers.retrieve(user?.stripeCustomerId) as Stripe.Customer;
            const defaultPaymentMethodId = customer?.invoice_settings?.default_payment_method;

            if(!defaultPaymentMethodId) {
                throw new Error('Need a valid payment method on file.');
            }

            const paymentIntent = await stripe.paymentIntents.create({
                amount: cancelFeeAmount,
                currency: 'usd',
                customer: user?.stripeCustomerId,
                payment_method: defaultPaymentMethodId as string,
                off_session: true,
                confirm: true,
                metadata: {
                   reason: 'Provider cancellation policy.',
                  },
                  application_fee_amount: Math.floor(cancelFeeAmount * platformFee),
                  transfer_data: {
                    destination: barber.stripeAccountId,
                  }
            })

            if(!paymentIntent?.id || !paymentIntent?.latest_charge) {
                throw new Error('Error getting payment intent id.')
            }

            const transaction = new Transaction({
                bookingNumber: booking.bookingNumber,
                bookingId: booking._id,
                userId: user._id,
                barberId: barber._id,
                amountCharges: cancelFeeAmount,
                amountPaid: cancelFeeAmount,
                amountRemaining: 0,
                paymentType: 'final',
                billingReason: 'Provider Cancellation Policy',
                currency: 'usd',
                stripeCustomerId: user.stripeCustomerId,
                stripePaymentIntentId: paymentIntent.id,
                chargeId: paymentIntent.latest_charge,
            })

            const t = await transaction.save({ session });

            user.transactions.push(t._id);
            barber.transactions.push(t._id);
        }

        if(booking.bookingStatus === 'pending' && booking.initialPaymentIntentId) {
                const intents = await stripe.paymentIntents.retrieve(booking.initialPaymentIntentId);

                if(intents.status === 'requires_capture') {
                    await stripe.paymentIntents.cancel(intents.id);
                }
        }
        
        booking.bookingStatus = 'canceled';
        booking.barberIsStarted = true;
        booking.barberIsComplete = true;
        await user.save({ session });
        await barber.save({ session });
        await booking.save({ session });


        await session.commitTransaction(); 
        session.endSession();

        try {
            io.to(String(barber._id)).emit(Notifications.BOOKING_CANCELLED_BY_USER, {
                message: `Booking has been cancelled by ${user.name.split(" ")[0]}`,
                time: `${booking.bookingDate} @${booking.bookingTime.split("-")[0]}`,
                bookingId,
            })
        } catch(err) {
            console.log('failed to emit to baber')
        }

        res.status(200).json({ message: 'Booking has been cancelled', ok: true})
    } catch(err) {
        await session.abortTransaction();
        session.endSession();
        console.log(err);
        res.status(500).json({ error: 'Error occurred: ' + err, ok: false })
    }
}