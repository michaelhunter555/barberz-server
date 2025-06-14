import { Request, Response } from 'express';
import Hours from '../../../models/Hours';

export default async function(req: Request, res: Response) {
    const { barberId, day, bulkDays, timeSlot } = req.body;

    console.log(barberId, day, bulkDays, timeSlot);

    if(!barberId) {
        return void res.status(404).json({error: 'barber id is falsy', ok: false})
    }

    try {
        let schedule = await Hours.findOne({ barberId: String(barberId) });
        
        if(!schedule) {
            return void res.status(404).json({ error: 'No schedule with the given id found.', ok: false})
        }

        if (!schedule.schedule[day]) {
            return void res.status(400).json({ error: 'Invalid day provided.', ok: false });
          }

          if(bulkDays.length > 0) {
            for(const days of bulkDays){
                schedule.schedule[days].push(timeSlot);
            }
          } else {
              schedule.schedule[day].push(timeSlot);
          }

         await schedule.save();
         res.status(201).json({ schedule: schedule.schedule, ok: true })
    } catch(err) {
        res.status(500).json({ error: 'Error creating new time slot. ' + err , ok: false})
    }
}