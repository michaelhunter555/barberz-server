import { Request, Response } from 'express';
import Stripe from 'stripe';

export default async function(req: Request, res: Response) {
const { stripeCustomerId } = req.query;
const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);

try {
const paymentMethods = await stripe.paymentMethods.list({
    customer: `${stripeCustomerId}`,
    type: 'card'
})
let hasCard = false;
if (paymentMethods.data.length > 0) {
    hasCard = true;
}

res.status(200).json({ hasCard, paymentMethods, ok: true })
} catch(err) {
    console.log(err);
    res.status(500).json({ error: 'Error getting payment methods', ok: false })
}

}