import { Request, Response } from 'express';
import User from '../../../models/Barber';
import Services from '../../../models/Services';
import { findUserById } from '../../../lib/database/findUserById';

export default async function(req: Request, res: Response) {
    const { service, id } = req.body;
    console.log(" Create Service", service)

    const user = await findUserById(String(id), res);

    if(!user) {
        return void res.status(404).json({ error: 'No user found for that id.', ok: false })
    }

    try {
        const currService = await Services.findOne({ barberId: String(id) });
        if(!currService) {
            const newService = new Services({
                barberId: user._id,
                services: [service]
            })
             await newService.save();
        } else {
            currService.services.push(service);
            await currService.save();
        }

        res.status(201).json({ message: `New Service created!`, ok: true, })
    } catch(err) {
        res.status(500).json({ error: 'Error creating service. ' + err, ok: false})
    }
}