import { Request, Response } from 'express';
import Service from '../../../models/Services';

export default async function(req: Request, res: Response) {
const { id, barberId } = req.query;

try {
    const service = await Service.findOne({ barberId: String(barberId) });
    if(!service){
        return void res.status(404).json({ error: 'No service with the given id found.', ok: false});
    }
    service.services = service.services.filter((s: { _id: string }) => s._id.toString() !== String(id))
    await service.save();
     res.status(200).json({ message: 'service has been deleted.', ok: true,});
} catch(err) {
    console.log(err);
    res.status(500).json({ error: 'An Error has occured while deleting the service. ' + err, ok: false})
}
}