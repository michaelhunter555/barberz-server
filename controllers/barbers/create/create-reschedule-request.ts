import { Request, Response } from 'express';
import Booking from '../../../models/Booking';
import { io } from '../../../app';
import { Notifications } from '../../../types';
import { formatDateString, formatToAMPM } from '../../../util/getBookingdateAndTime';

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

    if (booking.customerId) {
      io.to(String(booking.customerId)).emit(Notifications.BOOKING_RESCHEDULE_REQUESTED, {
        message: `${booking.barberName} sent a reschedule request`,
        requestDate: `${formattedDate} at ${startTimeStr}`, // For readable display
        bookingId: booking._id,
        text2: 'Please accept or reject this offer.',
      });
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
