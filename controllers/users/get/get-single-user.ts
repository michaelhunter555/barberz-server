import { Request, Response } from 'express';
import User from "../../../models/Barber";
import { getAccountDetails } from '../../../util/loginHelpers/loginHelpers';
import Booking from '../../../models/Booking';
import { ensureStripeCustomer } from '../../../util/createStripeAccount';
import Stripe from 'stripe';

export default async function(req: Request, res: Response) {
    const { email, name, imagePath } = req.body;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);

    try {
        // check if user already exists
        let user = await User.findOne({ email })

        // if they don't exist create a new user for them
        if(!user) {
            const newUser =  { 
                userIsLive: true,
                accountType: 'user',
                email, 
                name, 
                image: imagePath 
            }
            user = new User(newUser);
            await user.save();
        };

        if(!user.stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
            })
            user.stripeCustomerId = customer.id;
            await user.save();
        }
       
        const userData = getAccountDetails(user);
        res.status(200).json({ 
            userData, 
            ok: true,
         });

    } catch(err) {
        console.log(err);
         res.status(500).json({ error: 'An error has occurred. ' + err, ok: false});
    }
}