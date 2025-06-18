import { Request, Response } from 'express';
import Hours from '../../../models/Hours';

export default async function(req: Request, res: Response) {
    const { barberId } = req.query;

    try {
        const schedule = await Hours.findOne({ barberId: String(barberId) });
        if(!schedule) {
            return void res.status(404).json({ error: 'Unable to find a schedule by the given id.', ok: false })
        };
        const clearedSchedule = {};
        for(const day of Object.keys(schedule.schedule)){
            clearedSchedule[day] = [];
        }
        schedule.schedule = clearedSchedule;
        schedule.markModified('schedule');
        await schedule.save();
        res.status(200).json({ message: 'Schedule has been cleared.', ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error clearing schedule', ok: false })
    }
}