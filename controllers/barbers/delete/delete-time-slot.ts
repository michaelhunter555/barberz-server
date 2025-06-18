import { Request, Response } from 'express';
import Hours from '../../../models/Hours';
import mongoose from 'mongoose';

export default async function(req: Request, res: Response) {
    const { timeSlotIds, barberId, day } = req.body; // arr of ids

    if(!timeSlotIds || timeSlotIds.length === 0) {
        return void res.status(400).json({ error: 'No ids to delete.', ok: false})
    }

    try {
        const barberSchedule = await Hours.findOne({ barberId: String(barberId)});

        if(!barberSchedule) {
            return void res.status(404).json({ error: 'No schedule found for the given barber id.', ok: false });
        }

        if(barberSchedule && barberSchedule.barberId.toString() !== String(barberId)) {
            return void res.status(400).json({ error: 'You are not authorized to delete a time slot for this schedule.', ok: false })
        };
        const objectIds = timeSlotIds.map((id: string) => new mongoose.Types.ObjectId(id));

            await barberSchedule.updateOne({
                $pull: {
                    [`schedule.${day}`]: {
                        _id: { $in: objectIds }
                    }
                }
            });

        res.status(200).json({ message: 'Time slot(s) removed.', ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'An error has occured deleting your time slots. ' + err, ok: false });
    }
}