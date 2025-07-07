import { Request, Response } from 'express';
import Booking from '../../../models/Booking';

export default async function(req: Request, res: Response) {
  const { barberId, weekStart } = req.query;

  if (!barberId) {
    return void res.status(400).json({ error: 'Missing barberId', ok: false });
  }

  try {
    // Get the start of the requested week or default to this week
    const startOfWeek = weekStart ? new Date(String(weekStart)) : getStartOfWeek(new Date());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Find only accepted appointments within the week
    const appointments = await Booking.find({
      barberId: String(barberId),
      bookingStatus: 'confirmed',
      bookingDateAndTime: {
        $gte: startOfWeek,
        $lt: endOfWeek
      }
    }).sort({ bookingDateAndTime: 1 });

    res.status(200).json({
      ok: true,
      weekRange: {
        start: startOfWeek.toISOString(),
        end: endOfWeek.toISOString()
      },
      appointments
    });

  } catch (err) {
    console.error('Failed to get calendar bookings', err);
    res.status(500).json({ error: 'Failed to load bookings', ok: false });
  }
}

function getStartOfWeek(date: Date): Date {
  const day = date.getUTCDay(); // Sunday = 0
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff));
}
