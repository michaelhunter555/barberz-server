import stripe from "../../util/stripe";
import Barbers from '../../models/Barber';
import Transaction from "../../models/Transaction";
import expo, { isExpoPushToken } from "../../util/ExpoNotifications";
import { io } from "../../app";
import { checkRoom } from "../../util/checkRoomHelper";
import { AccountStatus, App, Notifications } from "../../types";

export default async function initiatePayout() {
    // bi-weekly cron - twice a week
    // check for stipe account id
    // check all bookings completed successfully
    const now = Date.now();
    const days2 = new Date(now - (2 * 24 * 60 * 60 * 1000));

    try {
        const transactions = await Transaction.aggregate([
            {
              $match: {
                createdAt: { $lte: days2 },
                hasDispute: false,
                paidOut: false,
                stripePaymentIntentId: { $exists: true, $ne: null },
                paymentType: { $ne: 'refund' },
              }
            },
            {
              $lookup: {
                from: 'barbers',
                localField: 'barberId',
                foreignField: '_id',
                as: 'barber'
              }
            },
            { $unwind: '$barber' },
            {
              $match: {
                'barber.accountStatus': AccountStatus.GOOD,
                'barber.stripeAccountId': { $exists: true, $ne: null }
              }
            },
            {
              $group: {
                _id: '$barberId', 
                stripeAccountId: { $first: '$barber.stripeAccountId' },
                pushToken: { $first: '$barber.pushToken' },
                transactions: { $push: '$_id' },
              }
            }
          ]);
          
        const payouts = transactions.map(async (barberGroup, i) => {

            const { _id: barberId, stripeAccountId, pushToken, transactions } = barberGroup;

            if(!stripeAccountId) return;

            const balance = await stripe.balance.retrieve({ stripeAccount: stripeAccountId });
            const totalAvailable = balance?.available?.find((b) => b.currency === 'usd');

            if (!totalAvailable || totalAvailable?.amount <= 0) return;

                const payout = await stripe.payouts.create({
                    amount: totalAvailable.amount,
                    currency: 'usd',
                }, { stripeAccount: stripeAccountId })

                await Transaction.updateMany(
                    { _id: { $in: transactions } },
                    { paidOut: true, payoutDate: new Date() }
                )

                if (['pending', 'in_transit'].includes(payout.status)) {
                    const isOnline = checkRoom(io, String(barberId));
                    if (isOnline) {
                        io.to(String(barberId)).emit(Notifications.PAYOUT_SENT, {
                            message: 'A payout has been issued.',
                            text: `A payout of $${(totalAvailable.amount / 100).toFixed(2)} has been issued.`
                        })
                    } else if (pushToken && isExpoPushToken(pushToken)) {
                        await expo.sendPushNotificationsAsync([
                            {
                                to: pushToken,
                                title: App.NAME,
                                subtitle: 'A payout has been issued!',
                                body: `A payout of $${(totalAvailable.amount / 100).toFixed(2)} has been issued.`,
                            }
                        ])
                    }
                }
            
        })

        await Promise.all(payouts);
        console.log("Cron Completed:")
    } catch (err) {
        console.log("Cron Failed to run", err);

    }
}