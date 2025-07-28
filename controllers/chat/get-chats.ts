import { Request, Response } from 'express';
import Chat from '../../models/Chat';

export default async function(req: Request, res: Response) {
    const { userId, page, limit, order } = req.query;
    const pageNum = parseInt(String(page),10) || 1;
    const limitNum = parseInt(String(limit), 10) || 10;
    const orderNum = order === "1" ? 1:-1;

    try {
        const chats = await Chat.find({
            participants: { $in: [userId] },
        }).skip((pageNum - 1) * limitNum)
        .limit(limitNum).sort({ updatedAt: orderNum });

        if(!chats) {
            return void res.status(404).json({ error: 'No chats associated with the given user id.', ok: false })
        }

        const totalChats = await Chat.countDocuments({ participants: { $in: [userId]}})
        const totalPages = Math.ceil(totalChats / limitNum);

        res.status(200).json({ 
            chats, 
            page: pageNum, 
            totalChats, 
            totalPages, 
            limit: limitNum, 
            ok: true 
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({ erorr: err, ok: false })
    }
}