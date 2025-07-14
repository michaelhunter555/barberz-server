import { Request, Response } from 'express';
import Transaction from '../../../models/Transaction';
import Dispute, { IDisputes } from '../../../models/Disputes';
import uploadToCloudinary from '../../../lib/cloudinary/cloudinaryHelper';
import { findUserById } from '../../../lib/database/findUserById';
import { io } from '../../../app';
import { Notifications } from '../../../types';

export default async function(req: Request, res: Response) {
    const { 
        transactionId,  
        userId 
    } = req.body;
    const disputeData = req.body;
    console.log("Dispute Data:", disputeData);
    const files = req.files as { [fieldName: string]: Express.Multer.File[]};
    
    if(!transactionId  || typeof transactionId !== "string") {
        return void res.status(400).json({error: 'Please pass a valid string id', ok: false  })
    }

    try {
        const disputes = await Dispute.findOne({ transactionId });
        if(disputes) {
            return void res.status(400).json({ error: 'A dispute for this transaction has already been created', ok: false })
        }

        const transaction = await Transaction.findById(transactionId);
        if(!transaction) {
            return void res.status(404).json({ error: 'No transaction with the given id exists.', ok: false })
        }

        const barber = await findUserById(transaction.barberId, res);
        if(!barber) {
            return void res.status(404).json({ error: 'No barber found with the given id.', ok: false })
        }

        const getStatus = () => {
            switch (disputeData.category) {
              case 'incorrect_charge_amount':
                return 'in_review';
          
              case 'service_not_provided':
                return 'awaiting_barber_response';
          
              case 'unsafe_environment':
                return disputeData.initiator === 'user'
                  ? 'awaiting_barber_response'
                  : 'awaiting_user_response';
          
              case 'client_behavoir':
                return 'awaiting_user_response';
          
              case 'barber_behavoir':
                return 'awaiting_barber_response';
          
              default:
                return 'in_review';
            }
          };
          
          const disputeStatus = getStatus();
        
        const disputeInfo: Partial<IDisputes> = {
            transactionId: transaction._id,
            ...(disputeData.initiator === 'barber' ? {
                barberId: userId,
                userId: transaction.userId
            }: { userId, barberId: transaction.barberId }),
            bookingId: transaction.bookingId,
            disputeExplanation: disputeData.disputeExplanation,
            disputeDate: new Date(),
            category: disputeData.category,
            initiator: disputeData.initiator,
            initiatorName: disputeData.initiatorName,
            amountPaid: transaction.amountPaid,
            stripePaymentIntentId: transaction.stripePaymentIntentId,
            barberName: barber.name,
            barberResponse: '',
            disputeStatus: String(disputeStatus) as IDisputes['disputeStatus'],
            action: 'pending',
            platformResponse: ''
        }

        if(files?.imageOne?.[0]) {
            const result = await uploadToCloudinary(files.imagesOne[0].buffer);
            disputeInfo.imageOne = result.secure_url;
        }

        if(files?.imageTwo?.[0]) {
            const result = await uploadToCloudinary(files.imagesTwo[0].buffer);
            disputeInfo.imageTwo = result.secure_url;
        }

        const dispute = new Dispute(disputeInfo);
        await dispute.save();

        console.log("new disputeId: ",dispute._id)

        transaction.hasDispute = true;
        transaction.disputeStartDate = dispute.disputeDate;
        transaction.disputeId = dispute._id;
        if(!transaction.serviceFee) {
            transaction.serviceFee = 0;
        }
        await transaction.save();

        try {
            if(disputeData.category !== 'incorrect_charge_amount') {
                io.to(String(barber?._id)).emit(Notifications.USER_DISPUTE_STARTED, {
                    message: `A dispute has been created`,
                    description: 'Your response is needed',
                    disputeId: dispute._id,
                })
            }
        } catch(err) {
            console.log('Notification emit error for dispute notice.')
        }

        res.status(200).json({ disputeId: dispute._id, ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error creating dispute.' + err, ok: false})
    }
}