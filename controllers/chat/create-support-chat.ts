import { Request, Response } from 'express';
import Chat from '../../models/Chat';
import Message from '../../models/Message';
import Barber from '../../models/Barber';
import { io } from '../../app';
import { Notifications } from '../../types';
import mongoose from 'mongoose';

const placeholder = 'https://res.cloudinary.com/dbbwuklgb/image/upload/v1753549795/placeholder_bkidl9.png';

export default async function(req: Request, res: Response) {
    //sender id vs receiverId
    const { 
        senderId
    } = req.body;
    const adminId = '64e7c5e1f1a0c2d5a3e56a00';

    if(!senderId) {
        return void res.status(400).json({ error: 'The user Id or senderId is not valid', ok: false })
    }

    try {
        const hasChat = await Chat.findOne({
            participants: { $all: [senderId, adminId] },
            chatIsComplete: false,
        });

        if(hasChat) {
            console.log("HAS CHAT: ")
            return void res.status(400).json({ error: 'You have support chats that are not marked as completed.', ok: false })
        }
        const user = await Barber.findById(String(senderId));

        if(!user) {
            return void res.status(400).json({ error: 'Could not find a user with the given id.', ok: false })
        }

        const chat = new Chat({
            participants: [new mongoose.Types.ObjectId(adminId), user?._id],
            participantInfo: [
                {id: adminId, name: 'Support Team', image: placeholder, role: 'admin' },
                {id: user._id, name:user.name, image: user.image, role: user.accountType, ...(user?.pushToken ? { pushToken: user.pushToken }: {}) }
            ],
            lastMessage: "Thank you for contacting support. Please leave a message and a team member will reply as soon as possible.",
            lastMessageTime: new Date(),
        })
        const message = new Message({
            chatId: chat._id,
            senderId: adminId,
            text: "Thank you for contacting support. Please leave a message and a team member will reply as soon as possible.",
            lastMessageTime: new Date(),
        })

        await chat.save();
        await message.save();

        res.status(201).json({
            chatId: chat._id, 
            ok: true 
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error creating chat and sending message ' + err , ok: false })

    }
}