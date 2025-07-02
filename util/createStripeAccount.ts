import Stripe from 'stripe';
import { IBarber } from '../models/Barber';

export const createStripeAccount = async (stripe: Stripe, customerName: string, email: string) => {
    const newStripeUser = await stripe.customers.create({
        name: customerName,
        email,
    });
    return newStripeUser;
}

export const ensureStripeCustomer = async (user: IBarber, stripe: Stripe) => {
    if (user.stripeCustomerId) return user.stripeCustomerId;
  
    const stripeCustomer = await createStripeAccount(stripe, user.name, user.email);
    user.stripeCustomerId = stripeCustomer.id;
    await user.save();
  
    return stripeCustomer.id;
  }
  