import { Request, Response } from 'express';
import Transactions from '../../../models/Transaction';

export default async function(req: Request, res: Response) {
    const { userId, page, limit, order } = req.query;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 10;
    const orderNum = parseInt(String(order), 10) === 1 ? 1 : -1

    if(!userId || userId === 'undefined') {
        return void res.status(400).json({ error: 'Please provide a valid string user id.', ok: false });
    }

    try {
        const transactions = await Transactions.find({ userId }).sort({ createdAt: orderNum })
        .skip((pageNum - 1) * limitNum).limit(limitNum)
        if(!transactions) {
            return void res.status(404).json({ error: 'No transactions found with for the given userId', ok: false })
        }

        const totalTransactions = await Transactions.countDocuments({ userId });
        const totalPages = Math.ceil(totalTransactions / limitNum);

        res.status(200).json({ 
            transactions,
            currentPage: page,
            totalPages,
            totalTransactions,
            ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error retrieving transactions.', ok: false })
    }
}