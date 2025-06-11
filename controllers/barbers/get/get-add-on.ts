import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Services from '../../../models/Services';

export default async function(req: Request, res: Response) {
    const { id } = req.query;

    try {
        const getAddOns = await Services.findOne({ barberId: String(id) });
        console.log("servicess: ", getAddOns);
        const services = getAddOns.services ?? [];
        res.status(200).json({ services, ok: true })
    } catch(err) {
        res.status(500).json({error: 'Error retrieving coupond user coupons data', ok: false})
    }

}