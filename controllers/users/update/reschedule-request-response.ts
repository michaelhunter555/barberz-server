import { Request, Response } from 'express';
import Booking from '../../../models/Booking';
import Barber from '../../../models/Barber';
import { io } from '../../../app';
import { App, Notifications } from '../../../types';
import Chat from '../../../models/Chat';
import Transaction from '../../../models/Transaction';
import Stripe from 'stripe';
import { getBookingDateTime } from '../../../util/getBookingdateAndTime';
import { checkRoom } from '../../../util/checkRoomHelper';
import expo, { isExpoPushToken } from '../../../util/ExpoNotifications';

export default async function(req: Request, res: Response) {
    const { response, bookingId, rescheduleData } = req.body;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);

    if(!response || !bookingId || !rescheduleData) {
        return void res.status(400).json({ error: 'Some or multiple fields are invalid, check your bookingId, response and reschedule object.', ok: true });
    };

    const { requestedDay, startTime, endTime } = rescheduleData;

    try {
        const booking = await Booking.findById(bookingId) // .populate('barber');
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
        const isOnline = checkRoom(io, String(booking.barberId));
        await booking.save()
        if(String(booking.barberId) && isOnline) {
            const notification = response === 'accept' ? 
            Notifications.BOOKING_RESCHEDULE_APPROVED 
            :Notifications.BOOKING_RESCHEDULE_DECLINED;

            io.to(String(booking.barberId)).emit(notification, {
                response: response,
                message: `Reschedule request ${response}ed`,
                bookingId: booking._id,
                text2: `${booking.customerName} ${response}ed your reschedule request. The booking is now ${response === 'accept' ? 'confirmed' : 'canceled'}`,
            })
        } else {
            try {
                const barber = await Barber.findById(booking.barberId).select('pushToken')
                if(barber && barber?.pushToken && isExpoPushToken(barber?.pushToken)) {
                    await expo.sendPushNotificationsAsync([
                        {
                            to: barber?.pushToken,
                            title: App.NAME,
                            subtitle: `Reschedule Request ${response}ed`,
                            body: `${booking.customerName} ${response}ed your reschedule request. The booking is now ${response === 'accept' ? 'confirmed' : 'canceled'}`,
                            data: {
                                path: `/booking/${booking._id}`
                            }
                        }
                    ])
                } else {
                    console.log(`No push token for ${barber._id}`)
                }
            } catch(err) {
                console.log("Could not find the barber", err);
            }
        }

        res.status(200).json({ bookingId: booking._id,  message: 'Request Sent!', ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: err, ok: false })
    }
}