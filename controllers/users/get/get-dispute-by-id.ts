import { Request, Response } from 'express';
import Dispute from '../../../models/Disputes';

export default async function(req: Request, res: Response) {
    const { disputeId } = req.query;
  
    if(!disputeId) {
        return void res.status(400).json({ error: 'Please pass a valid string id value', ok: false })
    }

    try {
        const dispute = await Dispute.findById(String(disputeId));
        if(!dispute) {
            return void res.status(404).json({ error: 'No dispute with the given id found.', ok: false })
        }

        res.status(200).json({ dispute, ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error getting dispute by id ' + err, ok: false })
    }
}