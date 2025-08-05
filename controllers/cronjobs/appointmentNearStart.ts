import { Request, Response } from 'express';
import Booking, { IBookings } from "../../models/Booking";
import expo, { isExpoPushToken } from "../../util/ExpoNotifications";
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { BookingStatus, App, Notifications } from '../../types'; 
import Barber from '../../models/Barber';
import { io } from '../../app';
import { checkRoom } from '../../util/checkRoomHelper';

export default async function () {
    const now = new Date();
    const min15 = new Date(now.getTime() + 15 * 60 * 1000);
    const min20 = new Date(now.getTime() + 20 * 60 * 1000);

    try {
        const bookings = await Booking.find({
            bookingDateAndTime: {
                $gte: min15,
                $lte: min20
            },
            bookingStatus: BookingStatus.CONFIRMED
        });

        if (!bookings || bookings.length === 0) {
            console.log("No upcoming bookings found in range.");
            return;
        }

        const notificationTasks: Promise<void>[] = [];
        const pushNotifications: ExpoPushMessage[] = [];

        for (const booking of bookings) {
            const task = (async () => {
             try {
                const [user, barber] = await Promise.all([
                    Barber.findById(booking.customerId),
                    Barber.findById(booking.barberId)
                ]);

                if (!user || !barber) {
                    console.log(`Unable to retrieve user (${booking.customerId}) or barber (${booking.barberId})`);
                    return;
                }

                // Notify user via socket or push
                const userIsOnline = checkRoom(io, String(user._id));
                if (userIsOnline) {
                    io.to(String(user._id)).emit(Notifications.APPOINTMENT_STARTS_SOON, {
                        message: `Your booking @${booking.bookingTime} starts soon!`,
                        text1: `Your appointment with ${barber.name} is set to begin. Please try to arrive at least 10 minutes early.`,
                        bookingId: booking._id,
                    });
                } else if (user.pushToken && isExpoPushToken(user.pushToken)) {
                    pushNotifications.push({
                        to: String(user.pushToken),
                        title: App.NAME,
                        subtitle: `Your booking @${booking.bookingTime} starts soon!`,
                        body: `Your appointment with ${barber.name} is set to begin. Please try to arrive at least 10 minutes early.`,
                        data: {
                            bookingId: booking._id,
                            path: `/booking/${booking._id}`
                        }
                    });
                }

                // Notify barber via socket or push
                const barberIsOnline = checkRoom(io, String(barber._id));
                if (barberIsOnline) {
                    io.to(String(barber._id)).emit(Notifications.APPOINTMENT_STARTS_SOON, {
                        message: `Your booking @${booking.bookingTime} starts soon!`,
                        text1: `Your appointment with ${user.name} is set to begin.`,
                        bookingId: booking._id,
                    });
                } else if (barber.pushToken && isExpoPushToken(barber.pushToken)) {
                    pushNotifications.push({
                        to: String(barber.pushToken),
                        title: App.NAME,
                        subtitle: `Your booking @${booking.bookingTime} starts soon!`,
                        body: `Your appointment with ${user.name} is set to begin. Please try to arrive at least 10 minutes early.`,
                        data: {
                            bookingId: booking._id,
                            path: `/booking/${booking._id}`
                        }
                    });
                }
            } catch(err) {
                console.log(err);
            }
            })();

            notificationTasks.push(task);
            
        }

        await Promise.all(notificationTasks);

        const chunks = expo.chunkPushNotifications(pushNotifications);
        await Promise.all(chunks.map(chunk => expo.sendPushNotificationsAsync(chunk)));
        console.log("Appointment Reminder Cron complete")
    } catch (err) {
        console.error("Cron exited with error", err);
    }
}
