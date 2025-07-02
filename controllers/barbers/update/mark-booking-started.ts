import { Request, Response } from 'express';
import Booking from '../../../models/Booking';
import Barber from '../../../models/Barber';
import { io } from '../../../app';
import { Notifications } from '../../../types';

export default async function(req: Request, res: Response) {
    const { bookingId } = req.query;

    try {
        const booking = await Booking.findOne({ _id: bookingId });

        if(!booking) {
            return void res.status(404).json({ error: 'Could not find a booking with the givrn id.', ok: false })
        }
        booking.barberIsStarted = true;
        booking.isConfirmed = true;
        booking.barberStartTime = new Date();
       await booking.save();

       const barber = await Barber.findByIdAndUpdate(booking.barberId, {
        status: 'Busy',
       })
       await barber.save();
       // update barber status --- has active booking
    
        if(booking.customerId){
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
        }

        res.status(200).json({ message: 'Successfully updated booking as started.', ok: true })
    } catch(err) {
        console.log(err)
        res.status(500).json({ error: 'Error updating booking status ' + err, ok: false })
    }


}