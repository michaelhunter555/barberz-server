import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Bookings from '../../../models/Booking';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY as string);

export default async function (req: Request, res: Response) {
  const { defaultPaymentMethodIds, userId } = req.body;

  if (!Array.isArray(defaultPaymentMethodIds) || defaultPaymentMethodIds.length === 0 || !userId) {
    return void res.status(400).json({ error: 'Please pass a valid string id array and userId.', ok: false });
  }

  try {
    const user = await findUserById(String(userId), res);
    if (!user) {
      return void res.status(404).json({ error: 'No user found with the given id', ok: false });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user?.stripeCustomerId,
      type: 'card',
    });

    const abandondedBookings = await Bookings.find({
      customerId: String(userId),
      bookingStatus: 'pending',
      paymentType: 'onCompletion',
      cancelFee: { $gte: 1 },
    });

    // If user is trying to remove all cards and they have pending bookings
    if (paymentMethods.data.length === defaultPaymentMethodIds.length && abandondedBookings.length > 0) {
      return void res.status(400).json({
        error: 'Please cancel your pending bookings before removing your payment methods.',
        ok: false,
        activeTransactions: true,
      });
    }

    let isDefault = false;

    // Detach each payment method
    for (const id of defaultPaymentMethodIds) {
      // If user is trying to remove their default card while having active bookings
      if (id === user?.stripeDefaultPaymentMethodId && abandondedBookings.length > 0) {
        return void res.status(400).json({
          error: 'Please update your default payment method or cancel your pending bookings before removing it.',
          ok: false,
        });
      }

      await stripe.paymentMethods.detach(id);

      // If this is the default card, clear it
      if (id === user?.stripeDefaultPaymentMethodId) {
        isDefault = true;
        user.stripeDefaultPaymentMethodId = '';
        await user.save();
      }
    }

    res.status(200).json({ isDefault, message: 'Payment method(s) removed', ok: true });
  } catch (err) {
    console.error('Detach error:', err);
    res.status(500).json({ error: 'Internal server error', ok: false });
  }
}
