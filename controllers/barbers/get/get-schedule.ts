import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Hours from '../../../models/Hours';

export default async function(req: Request, res: Response) {
    const { barberId } = req.query;

    if(!barberId) {
        return void res.status(400).json({ error: 'The id is undefined.', ok: false })
    }

    const user = await findUserById(String(barberId), res);

    try {
        const schedule = await Hours.findOne({ barberId: String(barberId) });

        if(!schedule) {
            const newSchedule = {
                barberId: String(barberId),
                schedule: {
                    "monday": [],
                    "tuesday": [],
                    "wednesday": [],
                    "thursday": [],
                    "friday": [],
                    "saturday": [],
                    "sunday": [],
                }
            }
            const createSchedule = new Hours(newSchedule);
            await createSchedule.save();
            user?.hours?.push(createSchedule._id);
            return void res.status(201).json({ schedule: newSchedule.schedule, ok: true })
        }
        res.status(200).json({ schedule: schedule.schedule, ok: true })
    } catch(err) {
        console.log("get schedule error", err);
        res.status(500).json({ error: 'Error getting your schedule.', ok: false })
    }
}