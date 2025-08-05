import { Router, Request, Response } from 'express';
import { Expo } from 'expo-server-sdk';
import Barber from '../models/Barber';

const expo = new Expo();
const router = Router();

const savedTokens: string[] = [];
router.post("/store-token", async (req: Request, res: Response) => {
    const { token, userId } = req.body;
    console.log("token body:", req.body)
    if(!userId || !token) {
        return void res.status(400).json({ error: 'Missing UserId or token', ok: false });
    }

    if(!Expo.isExpoPushToken(token)) {
        return void res.status(400).json({ error: 'Invalid push token', ok: false })
    }
    try {
        await Barber.findByIdAndUpdate(userId, { pushToken: token })
        console.log("stored token");
        res.status(200).json({ ok: true });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error storing push token. ' + err, ok: false })
    }
});

router.post("/send-notification", async (req: Request, res: Response) => {
    const { } = req.body;
    try {
        const ticketChunk = ''
        res.json({ ticketChunk, ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ err })
    }
})

export default router;