import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Barber from '../../../models/Barber';
import Hours from '../../../models/Hours';
import Services from '../../../models/Services';
import Review from '../../../models/Review';

export default async function(req: Request, res: Response) {
    const { barberId } = req.query;
    console.log("selected barberId: ", barberId)
    try {
        const barber = await Barber.findById(String(barberId))
        .populate({ 
            path: 'hours', 
            model: 'Hour',
        }).populate({
            path: 'services',
            model: 'Service',
        }).populate({
            path: 'coupons',
            model: 'Coupon',
        })

        if(!barber) {
            return void res.status(404).json({ error: 'No barber found with the given id.', ok: false });
        };

        console.log("Selected Barber: ", barber);

        res.status(200).json({ barber, ok: true  });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error getting barber data', ok: false });
    }
}