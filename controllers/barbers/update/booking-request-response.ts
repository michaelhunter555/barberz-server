import { Request, Response } from 'express';
import Booking, { IBookings } from '../../../models/Booking';
import { findUserById } from '../../../lib/database/findUserById';
import { io } from '../../../app';
import { App, BookingStatus, Notifications } from '../../../types';
import Stripe from 'stripe';
import Transaction from '../../../models/Transaction';
import Chat from '../../../models/Chat';
import expo, { isExpoPushToken } from '../../../util/ExpoNotifications';
import { checkRoom } from '../../../util/checkRoomHelper';
import mongoose from 'mongoose';

export default async function(req: Request, res: Response) {
    const { bookingResponse, bookingId, customerId } = req.body;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);

    if(!['confirmed','canceled'].includes(bookingResponse)) {
        return void res.status(400).json({ error: 'Unsupported booking response', ok: false })
    }

    const session = await mongoose.startSession();
    session.startTransaction()

    try {
        const booking = await Booking.findOne({ _id: bookingId });

        if(!booking) {
            return void res.status(404).json({ error: 'No booking found with the given id.', ok: false })
        }

        const [user, barber] = await Promise.all([
           findUserById(String(booking?.customerId), res),
           findUserById(String(booking?.barberId), res),
        ])

        if(!user || !barber) {
            return void res.status(404).json({ error: 'Could not find a barber and/or user with the given ids', ok: false })
        }

        // handle cases for 100% paid up front or half now, half later
        // booking remains in authorization state until barber confirms.
        // once the booking is (confirmed || canceled), we can take stripe action.
        if(booking.initialPaymentIntentId) {
            const intent = await stripe.paymentIntents.retrieve(booking.initialPaymentIntentId);
    
            if(bookingResponse ===  BookingStatus.CONFIRMED){
                if(intent.status === 'requires_capture') {
                    await stripe.paymentIntents.capture(intent.id);
                }
            }
    
            if(bookingResponse === BookingStatus.CANCELED) { // "canceled"
                if(intent.status === 'requires_capture') {
                    await stripe.paymentIntents.cancel(intent.id);
                    await Transaction.findByIdAndDelete({ bookingId: booking._id }, { session });
                }
                booking.barberIsComplete = true;
            }
            const chat = await Chat.findOne({
                bookingId: booking._id,
            })
            chat.chatIsComplete = true;
            await chat.save({ session });
        }

        booking.bookingStatus = bookingResponse as IBookings['bookingStatus'];
        booking.isConfirmed = bookingResponse === 'confirmed';
       await booking.save({ session });
       await session.commitTransaction();
       session.endSession();

       const responseMessage = `${barber?.name} ${
                bookingResponse === BookingStatus.CONFIRMED 
                ? 'confirmed'
                : bookingResponse ===  BookingStatus.CANCELED
                ? 'could not accept'
                : bookingResponse === BookingStatus.RESCHEDULE
                ? 'wants to reschedule': 'responded to'
            } your booking`;

        const isOnline = checkRoom(io, String(user._id));
    
        if(user && isOnline){
            io.to(String(user?._id)).emit(Notifications.BARBER_APPOINTMENT_RESPONSE, {
                booking,
                message: responseMessage,
            })
        } else if(user && user?.pushToken && isExpoPushToken(user?.pushToken)) {
            await expo.sendPushNotificationsAsync([
                {
                    to: user.pushToken,
                    title: App.NAME,
                    subtitle: responseMessage,
                    body: `Regarding your booking ${booking.bookingDate} @${booking.bookingTime} for $${booking.price.toFixed(2)}`,
                    data: { 
                        bookingId: booking._id,
                        path: `/booking/${booking._id}`
                     },
                }
            ])
        }
        // "pending" | "confirmed" | "completed" | "canceled" | "reschedule"
        res.status(200).json({ message: 'Booking updated to ' + bookingResponse, ok: true })
    } catch(err) {
        await session.abortTransaction();
        session.endSession();
        console.log(err)
        res.status(500).json({ error: 'Error updating booking status ' + err, ok: false })
    }


}