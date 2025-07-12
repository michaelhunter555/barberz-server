import { Request, Response } from 'express';
import Disputes from '../../../models/Disputes';

export default async function(req: Request, res: Response) {
    const { userId, page, limit, order } = req.query;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 10;
    const orderNum = Number(order) === -1 ? -1 : 1;

    if(!userId) {
        return void res.status(400).json({ error: 'Please pass a valid string id value', ok: false })
    }

    try {
        const disputes = await Disputes.find({ userId: String(userId) }).sort({ createdAt: orderNum }).skip((pageNum -1) * limitNum).limit(limitNum);

        if(!disputes) {
            return void res.status(404).json({ error: 'No disputes found for the given userId', ok: false })
        }
        const totalDisputes = await Disputes.countDocuments({ userId: String(userId) });
        const totalPages = Math.ceil(totalDisputes / limitNum);
        res.status(200).json({
            disputes,
            page: pageNum,
            limit: limitNum,
            totalPages,
            totalDisputes,
            ok: true,
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error getting dispute data ' + err, ok: false })
    }
}