import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Hours, { IDaySlot } from '../../../models/Hours';

export default async function(req: Request, res: Response) {
    const { barberId } = req.query;
    const { timeSlotId, day, daySlot } = req.body;

    if (!barberId) {
        return res.status(400).json({ error: 'The id is undefined.', ok: false });
    }

    try {
        const schedule = await Hours.findOne({ barberId: String(barberId) });
        if (!schedule) {
            return res.status(404).json({ error: 'No schedule found for the barberId.', ok: false });
        }

        const daySlots = schedule.schedule[day];
        if (!Array.isArray(daySlots)) {
            return res.status(400).json({ error: `Invalid day: ${day}`, ok: false });
        }

        const index = daySlots.findIndex(slot => slot._id?.toString() === timeSlotId);
        if (index === -1) {
            return res.status(404).json({ error: 'Time slot not found.', ok: false });
        }

        daySlots[index].startTime = {
            value: daySlot.value,
            hour: daySlot.startHour,
            minute: daySlot.startMinute,
        };

        daySlots[index].endTime = {
            value: daySlot.value,
            hour: daySlot.endHour,
            minute: daySlot.endMinute,
        };

        schedule.markModified(`schedule.${day}`);
        await schedule.save();

        res.status(200).json({ schedule: schedule.schedule, ok: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error getting your schedule.', ok: false });
    }
}
