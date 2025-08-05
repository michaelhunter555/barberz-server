import { Request, Response } from 'express';
import Booking from '../../../models/Booking';
import User from '../../../models/Barber';
import { io } from '../../../app';
import { App, Notifications } from '../../../types';
import { formatDateString, formatToAMPM } from '../../../util/getBookingdateAndTime';
import expo, { isExpoPushToken } from '../../../util/ExpoNotifications';
import { checkRoom } from '../../../util/checkRoomHelper';

export default async function(req: Request, res: Response) {
  const { rescheduleDate, duration, bookingId } = req.body;

  if (!rescheduleDate || !bookingId || duration < 1) {
    return void res.status(400).json({ error: 'Please pass a valid date or bookingId', ok: false });
  }

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return void res.status(404).json({ error: 'Could not find a booking with the given id', ok: false });
    }

    const startDate = new Date(rescheduleDate);
    const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);

    const yyyyMmDd = startDate.toISOString().split('T')[0]; // for formatDateString
    const startTimeStr = formatToAMPM(startDate.getHours(), startDate.getMinutes());
    const endTimeStr = formatToAMPM(endDate.getHours(), endDate.getMinutes());
    const formattedDate = formatDateString(yyyyMmDd);

    const rescheduleRequest = {
      requestedDay: formattedDate,   // e.g. "on July 31st, 2025"
      startTime: startTimeStr,       // e.g. "5:00 PM"
      endTime: endTimeStr,           // e.g. "7:00 PM"
    };

    booking.rescheduleRequest = rescheduleRequest;
    booking.bookingStatus = 'reschedule';
    await booking.save();
    
    const isOnline = checkRoom(io, String(booking.customerId))
    if (booking.customerId && isOnline) {
      io.to(String(booking.customerId)).emit(Notifications.BOOKING_RESCHEDULE_REQUESTED, {
        message: `${booking.barberName} sent a reschedule request`,
        requestDate: `${formattedDate} at ${startTimeStr}`, // For readable display
        bookingId: booking._id,
        text2: 'Please accept or reject this offer.',
      });
    } else {

      try  {
        const user = await User.findById(booking.customerId).select('pushToken');
        if(user && user?.pushToken && isExpoPushToken(user?.pushToken)) {
          await expo.sendPushNotificationsAsync([
            {
              to: user.pushToken,
              title: App.NAME,
              subtitle: `${booking.barberName} sent a reschedule request`,
              body: `The new date would be ${formattedDate} @${startTimeStr}. Please accept or reject this offer.`,
              data: {
                path: `/booking/${booking._id}`
              }
            }
          ])
        } else {
          console.log("No user push token for notification. - reschedule request")
        }
      } catch(err) {
        console.log("Error finding user: ", err)
      }

    }

    res.status(200).json({
      bookingId: booking._id,
      message: 'Request Sent!',
      ok: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong', ok: false });
  }
}
