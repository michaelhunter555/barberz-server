import { Request, Response } from 'express';
import Stripe from 'stripe';


export default async function(req: Request, res: Response) {
    const { stripeAccountId } = req.query;
    const stripe = new Stripe(String(process.env.STRIPE_TEST_SECRET_KEY));
    
    let isComplete = false;
    try {
        const onboardingStatus = await stripe.accounts.retrieve(String(stripeAccountId));
        if(onboardingStatus.details_submitted){
            isComplete = true;
        }
        res.status(200).json({ isComplete, ok: true })
    } catch(err) {
        res.status(500).json({ error: 'Error retrieving onboarding status', ok: false })
    }

}