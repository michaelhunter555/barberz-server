import { Request, Response } from 'express';
import Booking from '../../../models/Booking';

export default async function(req: Request, res: Response) {
  const { 
    barberId, 
    month // 2025-07
  } = req.query; 

  if (!barberId) {
    return void res.status(400).json({ error: 'Missing barberId', ok: false });
  }

  try {

    const [year, monthStr] = String(month).split("-");
    const startDate = new Date(Date.UTC(Number(year), Number(monthStr) - 1, 1));
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Find only accepted appointments within the week
    const appointments = await Booking.find({
      barberId: String(barberId),
      bookingStatus: 'confirmed',
      bookingDateAndTime: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ bookingDateAndTime: 1 });

    // Group bookings by ISO date string (yyyy-mm-dd)
    const groupedByDate: Record<string, any[]> = {};
    for (const booking of appointments) {
      const dateKey = new Date(booking.bookingDateAndTime).toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(booking);
    }

    res.status(200).json({
      ok: true,
      appointments: groupedByDate,
    });

  } catch (err) {
    console.error('Failed to get calendar bookings', err);
    res.status(500).json({ error: 'Failed to load bookings', ok: false });
  }
}