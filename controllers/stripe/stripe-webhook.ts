import { Request, Response } from 'express';
import Stripe from 'stripe';
import stripe from '../../util/stripe';
import expo, { isExpoPushToken, expoPushHandler } from '../../util/ExpoNotifications';
import Booking from '../../models/Booking';
import Transaction from '../../models/Transaction';
import Barber from '../../models/Barber';
import { io } from '../../app';
import { checkRoom } from '../../util/checkRoomHelper';
import { App, BookingPolicy, BookingStatus, Notifications, Payment } from '../../types';
import Chat from '../../models/Chat';
import mongoose from 'mongoose';

const sound = {
    critical: true,
    name: 'alert.wav',
    volume: 1.0,
}
const title = App.NAME;

export default async function(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"];
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig as string,
            String(process.env.STRIPE_WEBHOOK_SECRET) //STRIPE_WEBHOOK_SECRET
        )

        switch(event.type) {
            // setup intents - adding a card
            case "setup_intent.succeeded": {
                const session = event.data.object as Stripe.SetupIntent;
                const user = await Barber.findOne({ // <--- shared object barber & user
                    stripeCustomerId: session.customer,
                }).select('pushToken _id');

                const { pushToken, _id } = user;

                const isOnline = checkRoom(io, String(_id));

                if(isOnline) {
                    io.to(String(_id)).emit(Notifications.SETUP_INTENT_SUCCEEDED, {
                        message: 'You have successfully added a card!',
                        text1: 'You are now eligible to create bookings.'
                    })
                } else if(pushToken && isExpoPushToken(pushToken)) {
                   await expo.sendPushNotificationsAsync([
                    { 
                        to: pushToken,
                        title,
                        subtitle: 'Successfully added Payment method.',
                        body: 'You are now eligible to create bookings and communicate with providers',
                        data: {
                            path: '/myWallet'
                        },
                       sound: sound,
                    }
                   ])
                }

            }
            break;


            // payment_intents
            case "payment_intent.succeeded": {
                const dbSession = await mongoose.startSession();
                dbSession.startTransaction();
                try {
                console.log("Payment_intent.succeeded");
                const session = event.data.object as Stripe.PaymentIntent;
                const {transaction, userId, barberId, bookingId, bookingNumber, policy, tip, serviceFee } = session.metadata;
                const chargeId = typeof session.latest_charge === 'string' ? session.latest_charge : "";
                const paymentStatus = session.status;
                const stripePaymentIntentId = session.id;
                
                // transaction data
                const tData = JSON.parse(transaction);
                let transactionNum = 'transactionId';
                
                if(policy === BookingPolicy.HALF_NOW) {
                    const existingTransaction = await Transaction.exists({ bookingId }).session(dbSession);
                    if(existingTransaction){
                        transactionNum = 'transactionId2';
                    }
                }
                console.log("policy", policy)

                console.log("transactionNum:", transactionNum)
                 // Determine payment phase and notification topic
                 const isSecondPayment = policy === BookingPolicy.HALF_NOW && transactionNum === 'transactionId2';
                 const isHalfNow = policy === BookingPolicy.HALF_NOW;
                 const isPayInFull = policy === BookingPolicy.PAY_IN_FULL;
                 const isFinalPayment = isPayInFull || (isHalfNow && transactionNum === 'transactionId2')
                const newTransaction = new Transaction({
                    ...tData,
                    bookingNumber,
                    bookingId,
                    serviceFee,
                    userId,
                    barberId,
                    amountPaid: session.amount,
                    chargeId,
                    paymentStatus,
                    stripePaymentIntentId,
                    stripeCustomerId: session.customer,
                    currency: 'usd',
                    billingreason: policy === 'halfNow' ? 'Provider Pre-booking requirement': 'Service Completed'
                    
                })
                await newTransaction.save({ session: dbSession });
                const booking = await Booking.findByIdAndUpdate(bookingId,{
                    [transactionNum]: newTransaction._id,
                    bookingStatus: isFinalPayment ? BookingStatus.COMPLETED: BookingStatus.CONFIRMED ,
                    isConfirmed: true,
                    initialPaymentIntendId: transactionNum === 'transactionId' ?  session.id : undefined,
                }, { new: true, session: dbSession }).populate([
                    { path: 'barberId', select: '_id pushToken', },
                    { path: 'customerId', select: '_id pushToken', }
                ]);
                await dbSession.commitTransaction();
                dbSession.endSession();

                // notify user and barber
                const barberIsOnline = checkRoom(io, String(booking.barberId._id));
                const userIsOnline = checkRoom(io, String(booking.customerId._id));
                
                // Notification message
                const formattedAmount = (newTransaction.amountCharged / 100).toFixed(2);
                const message = isFinalPayment
                    ? `Final payment - $${formattedAmount} added to your balance!`
                    : `Confirmed - ${booking.customerName}'s appointment is confirmed - $${formattedAmount}`;

                // now notify the barber;
                if(barberIsOnline) {
                    io.to(String(booking.barberId._id)).emit(Notifications.USER_APPOINTMENT_NOTIFICATION, {
                        message,
                        appointment: {
                            _id: booking._id,
                            time: booking.bookingTime,
                            date: booking.bookingDate,
                            price: booking.price,
                            customerName: booking.customerName,
                        }
                    })
                } else if(booking.barberId?.pushToken && isExpoPushToken(booking.barberId?.pushToken)) {
                    await expo.sendPushNotificationsAsync([
                        {
                            to:booking.barberId?.pushToken,
                            title: App.NAME,
                            // subtract service fee for barbers from total!
                            subtitle :message,
                            body: isFinalPayment
                            ? `${booking.customerName}'s booking is completed & final payment received.`
                            : `${booking.customerName}'s booking confirmed for ${booking.bookingDate} @${booking.bookingTime}.`,
                            data: {
                              path: `/booking/${booking._id}`
                            },
                            sound: sound,

                        }
                    ])
                }

                //Notify user as well
                if(userIsOnline) {
                    io.to(String(booking.customerId._id)).emit(Notifications.BARBER_APPOINTMENT_RESPONSE, { booking, message })
                } else if(booking.customerId?.pushToken && isExpoPushToken(booking.customerId?.pushToken)) {
                    await expo.sendPushNotificationsAsync([
                        {
                            to: booking.customerId?.pushToken,
                            title: App.NAME,
                            subtitle: `${booking.barberName} confirmed your booking!`,
                            body: isFinalPayment
                            ? `${booking.customerName}'s booking is completed & final payment received.`
                            : `${booking.customerName}'s booking confirmed for ${booking.bookingDate} @${booking.bookingTime}.`,
                            data: { 
                                bookingId: booking._id,
                                path: `/booking/${booking._id}`
                             },
                        }
                    ])
                }
            } catch(err) {
                console.log(err);
            }
            }
            break;
            // booking as been rejected (if authorized)
            case "payment_intent.canceled" : {
                console.log("Payment_intent.canceled");
            }
            // failed payment
            case "payment_intent.payment_failed": {
                const session = event.data.object as Stripe.PaymentIntent;
                const { userId, bookingNumber, bookingId, policy } = session.metadata;
                const user = await Barber.findById(userId).select('_id pushToken');
                const booking = await Booking.findById(bookingId);
                const { pushToken, _id } = user;
                if(!user) {
                    console.log(`There is an issue finding the user by id: ${userId}. Or they may not exist.`);
                    return;
                }

                const isOnline = checkRoom(io, String(userId));
                if(isOnline) {
                    io.to(String(userId)).emit(Notifications.PAYMENT_FAILED, {
                        message: 'A payment has failed.',
                        text1: `A payment for ${bookingNumber} failed. Please update your payment method.`,
                        bookingId: booking._id,
                    })
                } else if(pushToken && isExpoPushToken(pushToken)) {
                    await expo.sendPushNotificationsAsync([
                      {  
                        to: pushToken,
                        title: App.NAME,
                        subtitle: 'A payment for a booking has failed',
                        body: `A payment for ${bookingNumber}`
                    }
                    ])
                }
            }
            break;
            // a booking request was created that requires confirmation for capture
            case "payment_intent.amount_capturable_updated": {
                console.log("Payment_intent.amount_capturable_updated")
                const session = event.data.object as Stripe.PaymentIntent;
                const { barberId, bookingId, } = session.metadata;
                const booking = await Booking.findByIdAndUpdate(bookingId, {
                    initialPaymentIntentId: session.id
                });
                
                if(!booking) return;
                if(session.status === 'requires_capture') {
                    const barber = await Barber.findById(barberId).select('pushToken _id');

                    if(!barber) return;

                    const isOnline = checkRoom(io, String(barber._id));

                    if(isOnline) {
                        io.to(String(barber._id)).emit(Notifications.USER_APPOINTMENT_NOTIFICATION, {
                            message: `Booking Request from ${booking.customerName}`,
                            appointment: {
                                _id: booking._id,
                                time: booking.bookingTime,
                                date: booking.bookingDate,
                                price: booking.price,
                                customerName: booking.customerName,
                            }
                        })
                    } else if(barber?.pushToken && isExpoPushToken(barber?.pushToken)) {
                        await expo.sendPushNotificationsAsync([
                            {
                                to: barber?.pushToken,
                                title: App.NAME,
                                subtitle: 'A booking requires confirmation!',
                                body: `${booking.customerName} sent an appointment request for ${booking.bookingDate} @${booking.bookingTime}`,
                                data: {
                                    path: `/booking/${booking._id}`
                                }
                            }
                        ])
                    }
                }
            }
            

            // refunds
            case "refund.created": {

            }
            break;
            case "refund.failed": {

            }
            break;
            case "application_fee.refunded": {

            }
            break;
            // payouts
            case "payout.canceled": {

            }
            break;
            case "payout.created": {

            }
            break;
            case "payout.failed": {

            }
            break;
            case "payout.paid": {

            }
            break;
            // account related
            case "account.updated": {

            }
            break;
            case "cash_balance.funds_available" : {

            }
            break;
            case "balance.available": {

            }
            break;
            // charges
            case "charge.failed": {

            }
            break;
            case "charge.pending": {
                
            }
            break;
            case "charge.captured": {
                
            }
            break;
            case "charge.expired": {
                
            }
            break;
            case "charge.refunded": {
                
            }
            break;
            case "charge.succeeded": {
                const session = event.data.object as Stripe.Charge;
                const { bookingNumber, barberId, userId } = session.metadata;
            
                const [transaction, barber, user ] = await Promise.all([
                    Transaction.findOne({
                        bookingNumber: bookingNumber
                    }),
                    Barber.findById(barberId).select('pushToken _id'),
                    Barber.findById(barberId).select('pushToken _id')
                ])

                if(!transaction) {
                    console.log(`failed to find a transaction for the given booking number: ${bookingNumber}`)
                }

                transaction.paymentStatus = Payment.SUCCEEDED;
                await transaction.save();

                const isOnline = checkRoom(io, String(barber._id))

                // now notify the barber;
                if(isOnline) {
                    io.to(String(barber._id)).emit(Notifications.PAYMENT_SUCCESS, {
                        message: `A payment of $${(session.amount / 100).toFixed(2)} has been authorized.`,
                        bookingId: transaction.bookingId,
                    })
                } else if(barber?.pushToken && isExpoPushToken(barber?.pushToken)) {
                    await expo.sendPushNotificationsAsync([
                        {
                            to: barber?.pushToken,
                            title: App.NAME,
                            subtitle: ``

                        }
                    ])
                }
            }
            break;
            // transfers
            case "transfer.created": {

            }
            break;
            case "transfer.reversed": {

            }
            break;
            case "transfer.updated": {

            }
            break;

            default: 
            console.log("event not included")
            
        }
        res.status(200).send({ received: true });
    } catch(err) {
        console.log("WebhookError: ", err)
         res.status(500).send('webhook Error')
    }
}
