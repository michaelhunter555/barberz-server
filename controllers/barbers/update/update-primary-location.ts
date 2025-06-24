import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';

export default async function(req: Request, res: Response) {
    const { barberId, primaryLocation } = req.body;

    console.log(primaryLocation)

    try {
        const barber = await findUserById(String(barberId), res);
        if(!barber) {
            return void res.status(404).json({ error: 'Did not find a user by that id.', ok: false });
        }
        barber.primaryLocation = primaryLocation;
        await barber.save();
        res.status(200).json({ primaryLocation, ok: true })
    } catch(err) {
        res.status(500).json({ error: 'Error updating barber primary location', ok: false })
    }
}