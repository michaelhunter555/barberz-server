import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Booking from '../../../models/Booking';

export default async function(req: Request, res: Response) {
    const { userId, bookingData, barberId } = req.body;

    try {
        const user = await findUserById(String(userId), res);
        const barber = await findUserById(String(barberId), res);
        if(!user) {
            return void res.status(404).json({ error: 'User not found.', ok: false })
        }
        if(!barber) {
            return void res.status(404).json({ error: 'barber not found.', ok: false })
        }

        const createBooking = {
            customerId: userId,
            barberId,
            bookingDate: bookingData.date,
            bookingTime: bookingData.time,
            bookingLocation: bookingData.location,
            isConfirmed: false,
            addOns: [...bookingData.addons],
            discount: bookingData.discount,
            discountId: bookingData.discountId,
            price: bookingData.price,
            tip: bookingData.tip ?? 0,
            platformFee: 0.10,
            barberIsStarted: false,
            barberStartTime: "",
            barberIsComplete: false,
            barberCompleteTime: "",
            customerConfirmComplete: false,
            bookingStatus: 'pending',
        }

        const newBooking = new Booking(createBooking);
        await newBooking.save();

        barber.requestedBooking = Number(barber?.requestedBooking ?? 0) + 1;
        barber.customerBookings?.push(newBooking._id);
        user.myBookings?.push(newBooking._id);
        user.userHasActiveBooking = !user.userHasActiveBooking;
        
        await barber.save();
        await user.save();
        
        res.status(201).json({ newBooking, ok: true })
    } catch(err) {
        res.status(500).json({ error: 'Error creating booing. ' + err, ok: false  })
    }
}