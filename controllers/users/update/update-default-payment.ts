import { Request, Response } from 'express';
import User from '../../../models/Barber';
import Stripe from 'stripe';

export default async function(req: Request, res: Response) {
    const { stripeCustomerId, paymentMethodId } = req.body;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);

    if(!stripeCustomerId) {
        return void res.status(500).json({ error: 'stripe customer id cannot be undefined.', ok: false });
    }

    try  {
    const user = await User.findOne({ stripeCustomerId });
    if(!user) {
        return void res.status(404).json({ error: 'No user with the given stripe id found. ', ok: false })
    }
        const paymentMethods = await stripe.paymentMethods.list({
            customer: `${stripeCustomerId}`,
            type: 'card',
        });

        if (paymentMethods?.data?.length === 0) {
            return void res.status(400).json({ error: 'No payment methods available for this customer.', ok: false });
          }
        const customer = await stripe.customers.retrieve(`${stripeCustomerId}`) as Stripe.Customer;
        
        let defaultPaymentId = paymentMethodId;
        const hasNoStripeDefault = !customer.invoice_settings?.default_payment_method;
        const hasNoLocalDefault = !user.stripeDefaultPaymentMethodId;
        const shouldSetFirstCardAsDefault = hasNoStripeDefault && hasNoLocalDefault;

        if (shouldSetFirstCardAsDefault) {
        defaultPaymentId = paymentMethods?.data[0]?.id;

        await stripe.customers.update(stripeCustomerId, {
            invoice_settings: {
            default_payment_method: defaultPaymentId,
            },
        });
        } else if (paymentMethodId) {
        await stripe.customers.update(stripeCustomerId, {
            invoice_settings: {
            default_payment_method: paymentMethodId,
            },
        });
        }

        user.stripeDefaultPaymentMethodId = defaultPaymentId;
        await user.save();

        res.status(200).json({ defaultPaymentId, ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error updating default payment method.', ok: false })
    }

}

