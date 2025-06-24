import { Request, Response } from 'express';

export default async function(req: Request, res: Response) {
    console.log(process.env.STRIPE_TEST_PUB_KEY)
        res.status(200).json({ stripePubKey: process.env.STRIPE_TEST_PUB_KEY });
}