import { Request, Response } from 'express';
import Chat from '../../models/Chat';
import Message from '../../models/Message';

export default async function(req: Request, res: Response) {
    const { chatId, page, limit, order } = req.query;
    const pageNum = parseInt(String(page),10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;
    const orderNum = order === "1" ? 1 : -1;

    try {
        const chatMessages = await Message.find({
            chatId: String(chatId)
        }).skip((pageNum - 1) * limitNum).limit(limitNum).sort({ createdAt: orderNum });

        if(!chatMessages) {
            return void res.status(404).json({ error: 'No chats associated with the given user id.', ok: false });
        }

        const totalMessages = await Message.countDocuments({ chatId: String(chatId) });
        const totalPages = Math.ceil(totalMessages / limitNum);

        res.status(200).json({ 
            chatMessages,
            totalMessages,
            totalPages,
            page: pageNum,
            limit: limitNum, 
            ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ erorr: err, ok: false })
    }
}