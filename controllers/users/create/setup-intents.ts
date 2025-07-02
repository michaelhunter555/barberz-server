import { Request, Response } from 'express';
import Stripe from 'stripe';

export default async function(req: Request, res: Response) {
    const { stripeCustomerId } = req.query;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);
    
    if(!stripeCustomerId) {
        return void res.status(404).json({ error: 'customer id is invalid. Make sure the stripeId is valid before sending.', ok: false })
    }

    try {
        const setupIntent = await stripe.setupIntents.create({
            customer: `${stripeCustomerId}`,
        })
        res.status(200).json({ clientSecret: setupIntent.client_secret })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error getting secret url', ok: false})
    }
}