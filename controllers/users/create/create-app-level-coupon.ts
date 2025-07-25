import { Request, Response} from 'express';
import User from '../../../models/Barber';
import Coupon from '../../../models/Coupon';

const rewardOptions = {
'GET10OFF': {amount: 10, requirement: 60},
'GET5OFF': { amount: 5, requirement: 30},
'GET2OFF': { amount: 2, requirement: 10}
}

export default async function(req: Request, res: Response) {
const { userId, rewardPoints, appCodeKey } = req.body;

if(!userId || !appCodeKey){
    return void res.status(400).json({ error: 'Please pass a valid string id and app code.', ok: false });
}

try {
    const user = await User.findById(String(userId));
    if(!user) {
        return void res.status(404).json({ error: 'Could not find a user by the given id.', ok: false });
    }

    if(user.rewardPoints < 10){
        return void res.status(400).json({ error: 'Not enough points to activate offer', ok: false })
    }

    const offer = rewardOptions[appCodeKey as keyof typeof rewardOptions];

    if(!offer) {
        throw new Error('Not a valid coupon id')
    }

    if(Number(rewardPoints) <= offer.requirement) {
        return void res.status(400).json({ error: 'You do not have enough points to redeem this offer.', ok: false })
    }

    const date = new Date();
    const expirationTime= date.getTime() + (30 * 24 * 60 * 60 * 1000);
    const expirationDate = new Date(expirationTime);

    const couponData = {
        name: 'reedem_reward',
        ownerId: userId,
        isPublic: false,
        isActive: true,
        transactionComplete: false,
        amount: offer.amount,
        amountType: 'amount',
        terms: 'Applies for services over $35',
        minPriceActivation: 35,
        expirationDate: String(expirationDate).split("T")[0],
        transactions: 0,
        onlyForUsers: [userId],
        isAppLevel: true,
    }

    const coupon = new Coupon(couponData);
    await coupon.save();

    user.hasAppLevelCoupon = true;
    user.appLevelCouponCodes.push(appCodeKey);
    user.rewardPoints = user.rewardPoints - offer.requirement;
    await user.save();

    res.status(201).json({ remainingPoints: user.rewardPoints, appCodeKey, hasAppLevelCoupon: true, ok: true })
} catch(err) {
    res.status(500).json({ error: 'An error has occured: ' + err, ok: false })
}
}