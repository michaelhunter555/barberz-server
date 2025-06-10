import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Coupon from '../../../models/Coupon';

export default async function(req: Request, res: Response) {
const { id } = req.query;
console.log("Deleted Coupon: ", id);
try {
    const coupon = await Coupon.findById(String(id));

    if(!coupon){
        return void res.status(404).json({ error: 'No coupon with the given id found.', ok: false});
    }
    let user = await findUserById(String(coupon.ownerId), res);
    if(!user) {
        return void res.status(404).json({ error: 'unable to find a user with the given id.', ok: false})
    }
    await coupon.deleteOne();
    user.coupons = user.coupons?.filter((couponId) => couponId.toString() !== String(id));
    await user?.save();
     res.status(200).json({ message: 'Coupon has been deleted.', ok: true,});
} catch(err) {
    console.log(err);
    res.status(500).json({ error: 'An Error has occured while deleting the coupon. ' + err, ok: false})
}
}