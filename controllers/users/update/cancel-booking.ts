import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking from '../../../models/Booking';
import User from '../../../models/Barber'; // <- intentional
import Transaction from '../../../models/Transaction';
import Chat from '../../../models/Chat';
import Stripe from 'stripe';
import { io } from '../../../app';
import { App, Notifications } from '../../../types';
import expo, { isExpoPushToken } from '../../../util/ExpoNotifications';
import { checkRoom } from '../../../util/checkRoomHelper';

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
            const { cancelFee, cancelFeeType, price, serviceFee } = booking;
            const baseCharge = Math.round((price - serviceFee) * 100);
            
            const isNumberAmount = cancelFeeType === 'number';
            let cancelFeeAmount: number = 0;
            
            if(isNumberAmount && cancelFee <= price) {
                cancelFeeAmount = Math.round(cancelFee * 100);
            }
            
            if(!isNumberAmount) {
                cancelFeeAmount = Math.round((price * 100) * (cancelFee / 100));
            }
            
            const proportionalServiceFee = serviceFee * (cancelFeeAmount / (price * 100));
            const platformCut = (baseCharge * platformFee) * (cancelFeeAmount / (price * 100));
            const applicationFee = Math.floor((proportionalServiceFee * 100) + platformCut);

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
                capture_method:'automatic',
                confirm: true,
                metadata: {
                    reason: 'Provider cancellation policy.',
                    cancelFeeType,
                    cancelFeeValue: String(cancelFee),
                    bookingId: String(booking._id)
                  },
                  application_fee_amount: applicationFee,
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
                amountCharged: cancelFeeAmount,
                amountPaid: cancelFeeAmount,
                serviceFee: proportionalServiceFee,
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

        const chat = await Chat.findByIdAndUpdate(booking.chatId, {
            chatIscomplete: true,
        })
        
        booking.bookingStatus = 'canceled';
        booking.barberIsStarted = true;
        booking.barberIsComplete = true;
        await user.save({ session });
        await barber.save({ session });
        await booking.save({ session });
        await chat.save({ session })


        await session.commitTransaction(); 
        session.endSession();
        
        const isOnline = checkRoom(io, String(barber._id));

       if(barber._id && isOnline) {
           io.to(String(barber._id)).emit(Notifications.BOOKING_CANCELLED_BY_USER, {
               message: `Booking has been cancelled by ${user.name.split(" ")[0]}`,
               time: `${booking.bookingDate} @${booking.bookingTime.split("-")[0]}`,
               bookingId,
           })
       } else if(barber && barber?.pushToken && isExpoPushToken(barber?.pushToken)) {
        await expo.sendPushNotificationsAsync([
            {
                to: barber.pushToken,
                title: App.NAME,
                subtitle: 'Booking canceled by client',
                body: `A booking ${booking.bookingDate} @${booking.bookingTime.split("-")[0]} has been canceled by the client.`,
                data: {
                    path: `/booking/${booking._id}`,
                }
            }
        ])
       }
       

        res.status(200).json({ message: 'Booking has been cancelled', ok: true})
    } catch(err) {
        await session.abortTransaction();
        session.endSession();
        console.log(err);
        res.status(500).json({ error: 'Error occurred: ' + err, ok: false })
    }
}