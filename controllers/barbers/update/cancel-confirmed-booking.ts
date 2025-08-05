import { Request, Response } from 'express';
import Booking from '../../../models/Booking';
import User from '../../../models/Barber';
import Stripe from 'stripe';
import { io } from '../../../app';
import { App, BookingStatus, Notifications } from '../../../types';
import Chat from '../../../models/Chat';
import expo, { isExpoPushToken } from '../../../util/ExpoNotifications';
import Barber from '../../../models/Barber';
import Strike from '../../../models/StrikeIncident';
import mongoose from 'mongoose';
import { checkRoom } from '../../../util/checkRoomHelper';

export default async function(req: Request, res: Response) {
    const { bookingId } = req.body;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);

    if(!bookingId) {
        return void res.status(400).json({ error: 'Please pass a valid booking id', ok: false })
    };
    const session = await mongoose.startSession();
    session.startTransaction();

    let result: Stripe.Refund | null = null;
    try {
            const booking = await Booking.findById(bookingId);
        
            if(!booking) {
                return void res.status(404).json({ error: 'Could not find a booking with the given id!', ok: false})
            }
        if(booking.initialPaymentIntentId) {
            const intent = await stripe.paymentIntents.retrieve(booking.initialPaymentIntentId);
            const chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id
            
            if(chargeId) {
               const refund = await stripe.refunds.create({
                charge: chargeId,
                reason: 'requested_by_customer',
                reverse_transfer: true,
                refund_application_fee: true,
                metadata: {
                    reason: 'Provider canceled a confirmed booking.'
                }
               })
               result = refund;
            }

            const charges = await stripe.charges.retrieve(String(chargeId));
            charges.transfer

            const barber = await Barber.findById(booking.barberId);
            if(!barber) {
                console.log("Could not find a barber with the given id");
            } else {
                barber.accountStrikes = (barber.accountStrikes || 0) + 1;
                barber.barberDebt = (barber.barberDebt || 0) + (booking.serviceFee / 100);
                const STRIKE_THRESHOLD = 1;
    
                if(barber.accountStrikes > STRIKE_THRESHOLD) {
                    const strikeData = {
                        userId: barber._id,
                        userName: barber.name,
                        bookingId: booking._id,
                        accountType: barber.accountType,
                        strikeDate: new Date(),
                        reason: 'canceled_confirmed_booking',
                        penaltyAmount: barber.barberDebt, // for stripe
                    }
                    const strike = new Strike(strikeData);
                    await strike.save();
                }
                await barber.save();
            }
        }
        booking.bookingStatus = BookingStatus.CANCELED;
        booking.barberIsComplete = true;
        booking.barberIsStarted = true;
        booking.barberCompleteTime = new Date();

        const chat = await Chat.findOne({
            bookingId: booking._id,
        })
        if(chat) {
            chat.chatIsComplete = true;
            await chat.save({ session });
        }

        await booking.save({ session });
        const isOnline = checkRoom(io, String(booking.customerId))

            if(String(booking.customerId) && isOnline) {
                io.to(String(booking.customerId)).emit(Notifications.BOOKING_CANCELLED_BY_BARBER, {
                    message: 'The booking has been cancelled',
                    action: "Payment method has been refunded."
                })
            } else {
                const user = await User.findById(booking.customerId).select('pushToken');
                if(user && user?.pushToken && isExpoPushToken(user?.pushToken)) {
                    const refundAmount = result ? (result?.amount / 100).toFixed(2) : ""; 
                    await expo.sendPushNotificationsAsync([
                        {
                            to: user?.pushToken,
                            title: App.NAME,
                            subtitle: `${booking.barberName} canceled your booking.`,
                            body: booking.initialPaymentIntentId ? 
                            `${booking.barberName} canceled your booking ${booking.bookingDate} @${booking.bookingTime}. A refund of $${refundAmount} has been issued.` 
                            : `${booking.barberName} canceled your booking ${booking.bookingDate} @${booking.bookingTime}. No Charges made.`
                        }
                    ])
                }
            }
            await session.commitTransaction();
            session.endSession();
        res.status(200).json({ result, ok: true});
    } catch(err) {
        await session.abortTransaction();
        session.endSession();
        console.log(err);
        res.status(500).json({ error: err, ok: false })
    }

}