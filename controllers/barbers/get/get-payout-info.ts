import { Request, Response } from 'express';
import Stripe from 'stripe';
import { findUserById } from '../../../lib/database/findUserById';

export default async function(req: Request, res: Response) {
    const { stripeAccountId } = req.query;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);

    if(!stripeAccountId) {
        return void res.status(400).json({ error: 'Please pass a valid string.', ok: false})
    }

    try {
    const [balance, payouts, account] = await Promise.all([
            stripe.balance.retrieve({ stripeAccount: String(stripeAccountId) }),
            stripe.payouts.list(
                { limit: 1 }, { stripeAccount: String(stripeAccountId) }
            ),
            stripe.accounts.retrieve(String(stripeAccountId))
        ])
        
        res.status(200).json({
            balance: {
              available: balance.available,
              pending: balance.pending
            },
            payouts: payouts.data,
            payoutSchedule: account.settings?.payouts,
            accountStatus: account.requirements,
            ok: true
          });
          
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: err, ok: false})
    }

}