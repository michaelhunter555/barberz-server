import { Request, Response } from 'express';

export default async function(req: Request, res: Response) {
        res.status(200).json({ stripePubKey: process.env.STRIPE_TEST_PUB_KEY });
}