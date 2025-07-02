import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Booking, { IBookings } from '../../../models/Booking';
import mongoose from 'mongoose';
import { TService } from '../../../models/Services';
import { io } from '../../../app';
import { Notifications } from '../../../types';

function getBookingDateTime(dateStr: string, timeStr: string): Date | null {
    try {
      // Clean the date: "on July 1st, 2025" → "July 1 2025"
      const cleanDate = dateStr
        .replace(/^on\s+/, '') // remove "on "
        .replace(/(\d+)(st|nd|rd|th)/, '$1') // remove ordinal suffixes
        .replace(',', ''); // remove comma
  
      // Clean the time: "5:00 PM-6:00 PM" → "5:00 PM"
      const startTime = timeStr
        .split('-')[0]
        .replace(/\u202F/g, ' ') // replace narrow no-break space with normal space
        .replace(/\s+/g, ' ') // collapse multiple spaces
        .trim();
  
      const dateTimeStr = `${cleanDate} ${startTime}`;
      const date = new Date(dateTimeStr);
  
      console.log('Parsed date string:', dateTimeStr);
      if (isNaN(date.getTime())) {
        return null;
      }
  
      return date;
    } catch (err) {
      return null;
    }
  }

export default async function(req: Request, res: Response) {
    const { userId, bookingData, barberId } = req.body;

    const {
        bookingDate,
        bookingTime,
        bookingLocation,
        addOns,
        discount,
        discountId,
        tip,
        price

      } = bookingData ?? {};

      if (!bookingDate || !bookingTime || !bookingLocation || !price) {
        return void res.status(400).json({
          error: 'Missing required booking fields.',
          ok: false
        });
      }

    try {
        const user = await findUserById(String(userId), res);
        const barber = await findUserById(String(barberId), res);
        if(!user) {
            return void res.status(404).json({ error: 'User not found.', ok: false })
        }
        if(!barber) {
            return void res.status(404).json({ error: 'barber not found.', ok: false })
        }

        const bookingDateAndTime = getBookingDateTime(bookingDate, bookingTime);
        if (!bookingDateAndTime) {
            console.log("Converted BookingDate: ", bookingDateAndTime)
        return void res.status(400).json({ error: 'Invalid booking date/time', ok: false });
        }

        const createBooking: Partial<IBookings> = {
            customerId: userId,
            customerName: user?.name,
            customerImg: user?.image,
            barberId,
            barberName: barber?.name,
            bookingDate: bookingDate,
            bookingTime: bookingTime,
            bookingDateAndTime,
            bookingLocation: bookingLocation,
            isConfirmed: false,
            addOns: Array.isArray(addOns) ? 
            addOns.filter(
                (a): a is TService =>
                  typeof a.name === 'string' &&
                  typeof a.description === 'string' &&
                  typeof a.price === 'number'
              ) : [],
            discount: discount,
            price: price,
            tip: tip ?? 0,
            platformFee: 0.10,
            barberIsStarted: false,
            barberStartTime: "",
            barberIsComplete: false,
            barberCompleteTime: "",
            customerConfirmComplete: false,
            bookingStatus: 'pending',
        }

        if (discountId && mongoose.Types.ObjectId.isValid(discountId)) {
            createBooking.discountId = discountId;
          }

        console.log("new booking", createBooking);
        const newBooking = new Booking(createBooking);
        await newBooking.save();

        barber.requestedBooking = Number(barber?.requestedBooking ?? 0) + 1;
        barber.customerBookings?.push(newBooking._id);
        user.myBookings?.push(newBooking._id);
        user.userHasActiveBooking = !user.userHasActiveBooking;
        
        await barber.save();
        await user.save();

        try{
            console.log(" 📡 Emit appoint to barber");
            io.to(barberId).emit(Notifications.USER_APPOINTMENT_NOTIFICATION, {
                message: `Booking Request from ${user.name}`,
                appointment: {
                    _id: newBooking._id,
                    time: bookingTime,
                    date: bookingDate,
                    price: price,
                    customerName: user.name,
                    customerId: user._id,
                    customerImg: user.image,
                    location: bookingLocation,
                    tip: tip ?? 0,
                    discount: discount ?? 0,
                    addOns: createBooking.addOns,
                    status: 'pending',
                  }
              });

        } catch(err) {
            console.log("Notification failed: ", err);
        }
        
        res.status(201).json({ newBooking, ok: true });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error creating booking. ' + err, ok: false  });
    }
}