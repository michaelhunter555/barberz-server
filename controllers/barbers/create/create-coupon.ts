import { Request, Response } from 'express';
import User from '../../../models/Barber';
import Coupon from '../../../models/Coupon';
import { findUserById } from '../../../lib/database/findUserById';

export default async function(req: Request, res: Response) {
    const { userId } = req.query;
    const { coupon, users } = req.body;

    const user = await findUserById((String(userId)), res);

    if(!user) {
        return void res.status(400).json({ error: 'No user found', ok: false })
    }

    try {
        const newCoupon = new Coupon({
            ownerId: user._id,
            isPublic: coupon.isPublic,
            isActive: coupon.isActive,
            transactionComplete: false,
            amount: coupon.amount,
            terms: coupon.terms,
            minPriceActivation: coupon.minPriceActivation,
            expirationDate: coupon.expirationDate,
            transactions: 0,
            ...(!coupon.isPublic ? { onlyForUsers: users }: {})
        })
        await newCoupon.save();
        res.status(201).json({ message: 'Coupon successfully created!', ok: true})
    } catch(err) {
        res.status(500).json({ error: 'error creating coupon ' + err, ok: false})
    }
}