import { Request, Response } from 'express';
import Chat from '../../models/Chat';
import Message from '../../models/Message';
import Barber from '../../models/Barber';
import { io } from '../../app';
import { Notifications } from '../../types';

export default async function (req: Request, res: Response) {
  const { chatId, senderId, text } = req.body;
  console.log(req.body)

  if (!chatId || !senderId || !text?.trim()) {
    return void res.status(400).json({
      error: 'chatId, senderId, and message text are required',
      ok: false,
    });
  }

  try {
    const sender = await Barber.findById(senderId);
    if (!sender) {
      return void res.status(404).json({
        error: 'Sender not found',
        ok: false,
      });
    }

    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        lastMessage: text,
        lastMessageTime: new Date(),
      },
      { new: true }
    );

    if (!chat) {
      return void res.status(404).json({ error: 'Chat not found', ok: false });
    }

    const message = new Message({
      chatId: chat._id,
      senderId,
      text,
      read: false,
    });

    await message.save();

    // Emit real-time notification to the other participant
    const { participantInfo } = chat;
    const receiver = participantInfo.find((p: any) => String(p.id) !== String(sender._id));

    /*
    if (receiver?.id) {
      io.to(String(receiver.id)).emit(Notifications.NEW_MESSAGE_FROM_USER, {
        message: `${sender.name} sent a message`,
        text,
        chatId: chat._id,
      });
    }
    */

    res.status(201).json({ message, ok: true });
  } catch (err) {
    console.error('Update Chat Error:', err);
    res.status(500).json({
      error: 'Internal server error while updating chat',
      ok: false,
    });
  }
}
