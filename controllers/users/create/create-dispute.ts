import { Request, Response } from 'express';
import Transaction from '../../../models/Transaction';
import Dispute from '../../../models/Disputes';
import uploadToCloudinary from '../../../lib/cloudinary/cloudinaryHelper';
import { findUserById } from '../../../lib/database/findUserById';
import { io } from '../../../app';
import { Notifications } from '../../../types';

export default async function(req: Request, res: Response) {
    const { transactionId, disputeData, userId } = req.body;
    const files = req.files;

    if(transactionId) {
        return void res.status(400).json({ })
    }

    try {
        const transaction = await Transaction.findById(transactionId);
        if(!transaction) {
            return void res.status(404).json({ error: 'No transaction with the given id exists.', ok: false })
        }

        const barber = await findUserById(transaction.barberId, res);
        if(!barber) {
            return void res.status(404).json({ error: 'No barber found with the given id.', ok: false })
        }

        let disputeStatus = "";
       switch(disputeData.category) {
        case 'incorrect_charge_amount': 
        disputeStatus = 'in_review'
        break;
        case 'service_not_provided': 
        disputeStatus = 'awaiting_barber_response';
        break;
        case 'unsafe_environment': 
        disputeStatus = disputeData.initiator === 'user' ? 'awaiting_barber_response': 'awaiting_user_response';
        break;
        case 'client_behavoir': 'awaiting_user_response';
        disputeStatus = 'awaiting_user_response';
        break;
        case 'barber_behavoir': 'awaiting_barber_response';
        disputeStatus = 'await_barber_response';
        break;
        default:
            disputeStatus = 'in_review';
            return 'in_review';
       }
        
        const disputeInfo = {
            ...(disputeData.initiator === 'barber' ? {
                barberId: userId,
                userId: transaction.userId
            }: { userId, barberId: transaction.barberId }),
            bookingId: transaction.bookingId,
            disputeExplanation: disputeData.disputeExplanation,
            disputeDate: new Date(),
            initiator: disputeData.initiator,
            inititatorName: disputeData.initiatorName,
            amountPaid: transaction.amountPaid,
            stripePaymentIntentId: transaction.stripePaymentIntentId,
            barberName: barber.name,
            barberResponse: '',
            disputeStatus: disputeStatus,
            decision: 'pending',
            action: 'none',
            platformResponse: ''
        }

        const dispute = new Dispute(disputeInfo);
        await dispute.save();

        transaction.hasDispute = true;
        transaction.disputeStartDate = new Date();
        transaction.disputeId = dispute._id;
        await transaction.save();

        try {
            io.to(String(barber?._id)).emit(Notifications.USER_DISPUTE_STARTED, {
                message: `A dispute has been created`,
                description: 'Your response is needed',
            })
        } catch(err) {
            console.log('Notification emit error for dispute notice.')
        }

        res.status(200).json({ message: 'Dispute has been created', ok: false })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error creating dispute.' + err, ok: false})
    }
}