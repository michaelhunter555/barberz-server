import { Request, Response } from 'express';
import User from "../../../models/Barber";
import { getAccountDetails } from '../../../util/loginHelpers/loginHelpers';
import Booking from '../../../models/Booking';

export default async function(req: Request, res: Response) {
    const { email, name, imagePath } = req.body;

    try {
        // check if user already exists
        let user = await User.findOne({ email })

        // if they don't exist create a new user for them
        if(!user) {
            const newUser =  { 
                userIsLive: true,
                accountType: 'user',
                email, 
                name, 
                image: imagePath 
            }
            user = new User(newUser);
            await user.save();
        };
      
            if (user.accountType === 'user') {
                await user.populate({
                    path: 'myBookings',
                    options: {
                        sort: { bookingDateAndTime: 1 }, // optional: sort upcoming first
                    }
                });
            }

            let upcomingBooking = null;
            let pendingRequest = null;
            if(user.accountType === 'barber'){
                user = await user.populate({
                    path: 'customerBookings',
                    options: {
                        sort: { bookingDateAndTime: 1 },
                    }
                });
            const now = new Date();

            // ✅ Find next confirmed appointment
            upcomingBooking = await Booking.findOne({
              barberId: user._id,
              bookingStatus: 'confirmed',
              bookingDateAndTime: { $gte: now },
            }).sort({ bookingDateAndTime: 1 });
      
            // ✅ Find next pending request
            pendingRequest = await Booking.findOne({
              barberId: user._id,
              bookingStatus: 'pending',
              bookingDateAndTime: { $gte: now },
            }).sort({ bookingDateAndTime: 1 });
        }

        const userData = getAccountDetails(user);
        res.status(200).json({ 
            userData, 
            ok: true,
            upcomingBooking,
            pendingRequest,
         });
    } catch(err) {
        console.log(err);
         res.status(500).json({ error: 'An error has occurred. ' + err, ok: false});
    }
}