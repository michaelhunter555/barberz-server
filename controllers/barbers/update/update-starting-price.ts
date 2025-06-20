import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';

export default async function(req: Request, res: Response) {
    const { id, newPrice } = req.body;

    // need to update all the prices for schedules slots!!!
    try {
        const barber = await findUserById(String(id), res);
        if(!barber) {
            return void res.status(404).json({ error: 'no user found with the given id.', ok: false})
        }
        barber.startingPrice = newPrice;
        await barber.save();
        res.status(200).json({ newPrice, ok: true });
    } catch(err) {
        console.log(err);
        res.status(500).json({ message: 'An error has occured: ' + err, ok: false})
    }

    
}