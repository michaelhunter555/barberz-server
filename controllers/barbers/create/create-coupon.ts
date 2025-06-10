import { Request, Response } from 'express';
import User from '../../../models/Barber';
import Coupon from '../../../models/Coupon';
import { findUserById } from '../../../lib/database/findUserById';

export default async function(req: Request, res: Response) {
    const { couponData, id, users } = req.body;
    console.log("Coupon: ",req.body)

    const user = await findUserById((String(id)), res);

    if(!user) {
        return void res.status(400).json({ error: 'No user found', ok: false })
    }

    try {
        const couponDetails = {
            name: couponData.name,
            ownerId: user._id,
            isPublic: couponData.isPublic,
            isActive: couponData.isActive,
            transactionComplete: false,
            amount: couponData.amount,
            terms: couponData.terms,
            minPriceActivation: couponData.minPriceActivation,
            expirationDate: couponData.expirationDate,
            transactions: 0,
            ...(!couponData.isPublic ? { onlyForUsers: users }: {})
        }
        const newCoupon = new Coupon(couponDetails);
        await newCoupon.save();
        user.coupons?.push(newCoupon._id);
        await user.save();
        res.status(201).json({ message: 'Coupon successfully created!', ok: true})
    } catch(err) {
        console.log("Error creating coupon", err);
        res.status(500).json({ error: 'error creating coupon ' + err, ok: false})
    }
}