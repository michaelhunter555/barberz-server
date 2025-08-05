import { Request, Response } from 'express';
import Dispute from '../../../models/Disputes';
import { io } from '../../../app';
import { App, Notifications } from '../../../types';
import User from '../../../models/Barber';
import expo, { isExpoPushToken } from '../../../util/ExpoNotifications';
import Booking from '../../../models/Booking';
import { checkRoom } from '../../../util/checkRoomHelper';

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

        const isOnline = checkRoom(io, String(dispute.userId));
        
            if(dispute.userId && isOnline) {
                io.to(String(dispute.userId)).emit(Notifications.BARBER_RESPONSE_TO_DISPUTE, {
                    message: ` dispute: ${dispute._id}`,
                    text: 'The barber has responded to the dispute',
                    disputeId: dispute._id,
                })
            } else {
                const user = await User.findById(dispute.UserId).select('pushToken');
                if(!user) {
                    console.log("Could not find user with the given id from dispute")
                } else {
                    if(user?.pushToken && isExpoPushToken(user?.pushToken)) {
                        await expo.sendPushNotificationsAsync([
                            {
                                to: user?.pushToken,
                                title: App.NAME,
                                subtitle: `Dispute Response`,
                                body: 'A response to your dispute has been added and is now in review.',
                                data: {
                                    path: `/dispute-center/${dispute._id}`
                                }
                            }
                        ])
                    }
                }
            }
        
        
        res.status(200).json({ message: 'response added', ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'There was an error added the barber response', ok: false })
    }
}