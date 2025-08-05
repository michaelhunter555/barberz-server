import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Stripe from 'stripe';


export default async function( req: Request, res: Response) {
    const { barberId } = req.query;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);

    try {
        const barber = await findUserById(String(barberId), res);
        if(!barber) {
            return void res.status(404).json({ error: 'No user found with the given id.', ok: false })
        }

        const account = await stripe.accounts.create({
            country: 'US',
            email: barber.email,
            controller: {
                losses: {
                    payments: 'stripe',
                },
                fees: {
                    payer: 'application',
                },
                stripe_dashboard: {
                    type: 'express',
                },
                requirement_collection: 'stripe'
            },
            settings: {
                payouts: {
                    debit_negative_balances: true,
                    schedule: {
                        interval: 'manual',
                    }
                }
            }
        });

        let accountLink: Stripe.AccountLink | {} = {};
        if(account.id) {
            barber.stripeAccountId = account.id;
            await barber.save();

            accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.NGROK_SERVER_URL}/reauth`,
            return_url: `${process.env.NGROK_SERVER_URL}/return`,
            type: 'account_onboarding',
            });
        };

        if(!accountLink) {
            return void res.status(500).json({ error: 'error retrieving account link', ok: false})
        }
        
        res.status(201).json({ accountLink, stripeAccountId: account.id, ok: true })
     } catch(err) {
        console.log("Create stripe error: " ,err)
        res.status(500).json({ error: 'error occured during account creation.', ok: false })
     }
}