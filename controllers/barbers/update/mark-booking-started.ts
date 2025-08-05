import { Request, Response } from 'express';
import Booking from '../../../models/Booking';
import Barber from '../../../models/Barber';
import { io } from '../../../app';
import { App, Notifications } from '../../../types';
import expo, { isExpoPushToken } from '../../../util/ExpoNotifications';
import { checkRoom } from '../../../util/checkRoomHelper';

export default async function(req: Request, res: Response) {
    const { bookingId } = req.query;

    if(!bookingId || bookingId === 'undefined') {
        return void res.status(400).json({ error: 'BookingId is required.', ok: false });
    }

    try {
        const booking = await Booking.findOne({ _id: bookingId });

        if(!booking) {
            return void res.status(404).json({ error: 'Could not find a booking with the given id.', ok: false })
        }
        booking.barberIsStarted = true;
        booking.isConfirmed = true;
        booking.barberStartTime = new Date();
       await booking.save();

       const [user, barber] = await Promise.all([
        Barber.findById(booking.customerId), // user 
        Barber.findByIdAndUpdate(booking.barberId, { // barber
            status: 'Busy',
           }, { new: true })
       ])

       const isOnline = checkRoom(io, String(booking.customerId));
        if(booking.customerId && isOnline){
            io.to(String(booking.customerId)).emit(Notifications.BARBER_STARTED_APPOINTMENT, {
                startTime: booking.barberStartTime.toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',    
                    hour12: true,
                }),
                message: `${booking.barberName} started your appointment.`,
            })
        } else if(user?.pushToken && isExpoPushToken(user?.pushToken)) {
            await expo.sendPushNotificationsAsync([
                {
                    to: user.pushToken,
                    title: App.NAME,
                    subtitle: `${booking.bookingNumber} Started.`,
                    body: `${barber?.name || 'Your barber'} has marked your booking as [started] for ${booking.bookingNumber}.`,
                    data: {
                        path: `/booking/${booking._id}`
                    }
                }
            ]) 
        } else {
            console.log("No PushToken or socket for user:", user._id )
        }

        res.status(200).json({ message: 'Successfully updated booking as started.', ok: true })
    } catch(err) {
        console.log(err)
        res.status(500).json({ error: 'Error updating booking status ' + err, ok: false })
    }


}