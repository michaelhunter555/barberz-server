import { Request, Response } from 'express';
import Chat from '../../models/Chat';
import Message from '../../models/Message';
import Barber from '../../models/Barber';
import { io } from '../../app';
import { Notifications } from '../../types';

export default async function(req: Request, res: Response) {
    //sender id vs receiverId
    const { 
        senderId, 
        receiverId, 
        lastMessage, 
        lastMessageTime, 
        accountType,
        bookingId,
    } = req.body;

    if(!senderId || !receiverId || !lastMessage) {
        return void res.status(400).json({ error: 'The user Id or senderId is not valid', ok: false })
    }

    try {
        const [receiver, sender] = await Promise.all([
            Barber.findById(String(receiverId)),
            Barber.findById(String(senderId)),
        ])

        if(!receiver || !sender) {
            return void res.status(400).json({ error: 'Could not find the receiver or sender accounts', ok: false })
        }

        const accType = accountType  === 'user' ? 'user' : 'barber';
        const otherAccType = accType === 'user' ? 'barber' : 'user';

        const chat = new Chat({
            bookingId,
            participants: [receiver._id, sender._id],
            participantInfo: [
                {id: receiver._id, name: receiver.name, image: receiver.image, role: accountType},
                {id: sender._id, name:sender.name, image: sender.image, role: otherAccType}
            ],
            lastMessage,
            lastMessageTime,
        })
        const newChat = await chat.save();

        const message = new Message({
            chatId: newChat._id,
            senderId,
            text: lastMessage,
            read: false,
        })
        await message.save();

        if(String(receiver._id)){
            io.to(String(receiver._id)).emit(Notifications.NEW_MESSAGE_FROM_USER, {
                message: `${sender.name} sent you a message`,
                bookingId,
                messagePreview: lastMessage.substring(0,40) + "..."
            })
        }

        res.status(201).json({ chatId: chat._id, message, ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error creating chat and sending message ' + err , ok: false })

    }
}