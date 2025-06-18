import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Coupon from '../../../models/Coupon';

export default async function(req: Request, res: Response) {
    const { id } = req.query;

    try {
        const user = await findUserById(String(id), res);
        if(!user) {
            return void res.status(404).json({ error: 'Could not find a user with the given id.', ok: false })
        }
        const coupons = await Coupon.find({ ownerId: user._id });
        res.status(200).json({ coupons, ok: true })
    } catch(err) {
        res.status(500).json({error: 'Error retrieving coupond user coupons data', ok: false})
    }

}