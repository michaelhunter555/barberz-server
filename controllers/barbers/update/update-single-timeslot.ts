import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Hours, { IDaySlot } from '../../../models/Hours';

export default async function(req: Request, res: Response) {
    const { barberId } = req.query;
    const { timeSlotId, day, daySlot } = req.body;

    if (!barberId) {
        return void res.status(400).json({ error: 'The id is undefined.', ok: false });
    }

    try {
        const schedule = await Hours.findOne({ barberId: String(barberId) });
        if (!schedule) {
            return void res.status(404).json({ error: 'No schedule found for the barberId.', ok: false });
        }

        const daySlots = schedule.schedule[day];
        if (!Array.isArray(daySlots)) {
            return void res.status(400).json({ error: `Invalid day: ${day}`, ok: false });
        }

        const index = daySlots.findIndex(slot => slot._id?.toString() === timeSlotId);
        if (index === -1) {
            return void res.status(404).json({ error: 'Time slot not found.', ok: false });
        }

        daySlots[index].startTime = {
            value: daySlot.startTime.value,
            hour: daySlot.startTime.hour,
            minute: daySlot.startTime.minute,
        };

        daySlots[index].endTime = {
            value: daySlot.endTime.value,
            hour: daySlot.endTime.hour,
            minute: daySlot.endTime.minute,
        };
        
        schedule.markModified(`schedule.${day}`);
        await schedule.save();

        res.status(200).json({ schedule: schedule.schedule, ok: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating your schedule.', ok: false });
    }
}
