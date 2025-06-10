import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Coupon from '../../../models/Coupon';

export default async function(req: Request, res: Response) {
const { editCoupon } = req.body;
console.log("Edited Coupon: ", editCoupon);
try {
    const coupon = await Coupon.findByIdAndUpdate(editCoupon._id, { ...editCoupon });
    if(!coupon){
        return void res.status(404).json({ error: 'No coupon with the given id found.', ok: false});
    }
     res.status(200).json({ message: 'Update Successful', ok: true,})
} catch(err) {
    res.status(500).json({ error: 'An Error has occured while updating the coupon. ' + err, ok: false})
}
}