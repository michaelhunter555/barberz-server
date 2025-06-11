import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Service, { TService } from '../../../models/Services';

export default async function(req: Request, res: Response) {
const { barberId } = req.query;
const { editService, id } = req.body;
console.log("Edited Service: ", editService);

try {
    const service = await Service.findOne({ barberId: String(barberId) });

    if(!service){
        return void res.status(404).json({ error: 'No Service with the given id found.', ok: false});
    }
     const serviceToEdit = service.services.id(String(id));
     if(!serviceToEdit) {
        return void res.status(404).json({ error: 'No service with the given id found.', ok: false })
     }
       // Update its fields
    serviceToEdit.name = editService.name;
    serviceToEdit.description = editService.description;
    serviceToEdit.price = Number(editService.price)

    await service.save();
     res.status(200).json({ message: 'Update Successful', ok: true,})
} catch(err) {
    res.status(500).json({ error: 'An Error has occured while updating the Service. ' + err, ok: false})
}
}