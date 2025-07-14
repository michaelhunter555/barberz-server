import { Request, Response } from 'express';
import Dispute from '../../../models/Disputes';
import { io } from '../../../app';
import { Notifications } from '../../../types';

export default async function(req: Request, res: Response) {
    const { disputeId, barberResponse } = req.body;

    if(!disputeId || !barberResponse) {
        return void res.status(400).json({ error: 'please provide a valid string id and response for the booking.', ok: false })
    }
    
    try {
        const dispute = await Dispute.findById(disputeId);
        if(!dispute) {
            return void res.status(404).json({ error: 'No dispute document with the given id.', ok: false })
        }
        dispute.barberResponse = barberResponse;
        dispute.disputeStatus = 'in_review';
        dispute.action = 'pending';
        await dispute.save();

        try {
            io.to(String(dispute.userId)).emit(Notifications.BARBER_RESPONSE_TO_DISPUTE, {
                message: ` dispute: ${dispute._id}`,
                text: 'The barber has responded to in the dispute',
                disputeId: dispute._id,
            })
        } catch(err) {
            console.log('Error emmiting to user.')
        }
        
        res.status(200).json({ message: 'response added', ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'There was an error added the barber response', ok: false })
    }
}