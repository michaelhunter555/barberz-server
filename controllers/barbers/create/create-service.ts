import { Request, Response } from 'express';
import User from '../../../models/Barber';
import Services from '../../../models/Services';
import { findUserById } from '../../../lib/database/findUserById';

export default async function(req: Request, res: Response) {
    const { id } = req.query;
    const { service } = req.body;

    const user = await findUserById(String(id), res);

    if(!user) {
        return void res.status(404).json({ error: 'No user found for that id.', ok: false })
    }

    try {
        const newService = new Services({
            barberId: user._id,
            service: {
                name: service.name,
                description: service.description,
                price: service.price,
            }
        })
        await newService.save()
        res.status(201).json({ message: 'New Service created!', ok: true, })
    } catch(err) {
        res.status(500).json({ error: 'Error creating service. ' + err, ok: false})
    }
}