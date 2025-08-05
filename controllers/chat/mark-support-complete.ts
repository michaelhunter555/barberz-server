import { Request, Response } from 'express';
import Chat from '../../models/Chat';
import Message from '../../models/Message';
import Barber from '../../models/Barber';
import { io } from '../../app';
import { Notifications } from '../../types';
import mongoose from 'mongoose';


export default async function(req: Request, res: Response) {
const { chatIsComplete, chatId } = req.body;

console.log(req.body)

if(!chatIsComplete || !chatId) {
    return void res.status(400).json({ error: 'Please provide a valid chat Id and/or whether the chat is complete', ok: false })
}

try {
await Chat.findByIdAndUpdate(chatId, { chatIsComplete })
res.status(200).json({ chatIsComplete: true, ok: true })
 } catch(err) {
    console.log(err)
res.status(500).json({ error: err, ok: false })
 }
}