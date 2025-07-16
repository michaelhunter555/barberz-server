import { Request, Response } from 'express';
import Booking from '../../../models/Booking';
import Hours from '../../../models/Hours';

export default async function(req: Request, res: Response) {
  const { barberId, selectedDate } = req.query;

  if (!barberId || !selectedDate) {
    return void res.status(400).json({ error: 'Missing barberId or selectedDate', ok: false });
  }

  try {
    const isoDate = new Date(`${selectedDate}T00:00:00`); // Ensure it's parsed correctly in local time
    const weekday = isoDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Get this barber's schedule (e.g., tuesday slots)
    const hours = await Hours.findOne({ barberId: String(barberId) });
    if (!hours) {
      return void res.status(404).json({ error: 'No schedule found for this barber', ok: false });
    }

    const availableSlots = hours.schedule?.[weekday] ?? [];

    // Find confirmed bookings for that day only
    const startOfDay = new Date(isoDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(isoDate.setHours(23, 59, 59, 999));

    const booked = await Booking.find({
      barberId: String(barberId),
      bookingDateAndTime: { $gte: startOfDay, $lte: endOfDay },
      bookingStatus: 'confirmed',
    });

    // Extract only booked times (e.g., "5:00 PM-6:00 PM")
    const takenTimes = booked.map(b => b.bookingTime).filter(Boolean);

     res.status(200).json({
      takenTimes,        // e.g., ["5:00 PM-6:00 PM"]
      availableSlots,    // optionally return this too
      ok: true,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred', ok: false });
  }
}

