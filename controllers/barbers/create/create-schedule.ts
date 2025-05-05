import { Request, Response } from 'express';
import Hours from '../../../models/Hours';
import User from '../../../models/Barber';
import { DAYS_OF_WEEK, MINUTES } from '../../../types';

export default async function(req: Request, res: Response) {
    const { schedule, email, id } = req.body;

    try {
        const user = await User.findOne({ email });
        if(!user) {
            return void res.status(400).json({ error: "Could not find an account with the following email", ok: false })
        }

        if(user.accountType !== "barber") {
            return void res.status(400).json({ error: "Only barbers are able to create schedules", ok: false })
        }
        // schedules should be a an array of obj that we can iterate over
        // availability is assumed weekly and repeated
       const newSchedule = schedule.map(async (s) => {
            const slot = {
                day: s.day,
                // value is single digit time
                startTime: { value: s.startValue, hour: s.startHour, minute: s.startMinute },
                endTime: { value: s.endValue, hour: s.endHour, minute: s.endMinute },
                price: s.price,
                isBooked: false,
            }
            const newHourSlot = new Hours(slot);
            return await newHourSlot.save();
        })
        await Promise.all(newSchedule);
    } catch(err) {

    }
}