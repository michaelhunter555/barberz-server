import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking from '../../../models/Booking';
import { io } from '../../../app';
import { Notifications } from '../../../types';
import Barber from '../../../models/Barber';
import Stripe from 'stripe';
import Transaction from '../../../models/Transaction';

export default async function(req: Request, res: Response) {
    const { bookingId } = req.query;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);
    const platformFee = Number(process.env.PLATFORM_FEE);

    if (isNaN(platformFee)) {
        throw new Error('Invalid PLATFORM_FEE environment variable.');
      }

    const session = await mongoose.startSession();
    session.startTransaction();
    const booking = await Booking.findOne({ _id: bookingId });

    if(!booking) {
        return void res.status(404).json({ error: 'Could not find a booking with the givrn id.', ok: false })
    }
    const [user, barber] = await Promise.all([
        Barber.findById(booking.customerId),
        Barber.findById(booking.barberId),
    ])

    try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId) as Stripe.Customer;
        const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;

        if (!defaultPaymentMethod) {
            throw new Error('No payment method on file');
        }       

          if (
            (booking.paymentType === 'onCompletion') ||
            (booking.paymentType === 'halfNow' && booking.remainingAmount > 0)
          ) {
            const fullServiceFee = Number(booking.serviceFee ?? 0);
            const platformFee = Number(process.env.PLATFORM_FEE); // 0.08 for 8%
            const chargePortion = booking.paymentType === 'halfNow' ? 0.5 : 1;

            const recordedServiceFee = fullServiceFee * chargePortion;
            const baseAmount = Math.round((booking.price - fullServiceFee) * 100);
            const amountToCharge = Math.round(booking.price * 100 * chargePortion); // amount being collected now

            const applicationFeeAmount = Math.floor(
              recordedServiceFee * 100 + baseAmount * chargePortion * platformFee
            );
          
            const paymentIntent = await stripe.paymentIntents.create({
              amount: amountToCharge,
              currency: 'usd',
              customer: user.stripeCustomerId,
              payment_method: customer.invoice_settings?.default_payment_method as string,
              off_session: true,
              capture_method: 'automatic',
              confirm: true,
              metadata: {
                userId: booking.customerId.toString(),
                barberId: booking.barberId.toString(),
                policy: booking.paymentType,
              },
              application_fee_amount: applicationFeeAmount,
              transfer_data: {
                destination: barber.stripeAccountId,
              },
            });

            const transaction = new Transaction({
              bookingNumber: booking.bookingNumber,
              bookingId: booking._id,
              userId: user._id,
              barberId: barber._id,
              serviceFee: recordedServiceFee,
              stripePaymentIntentId: paymentIntent.id,
              stripeCustomerId: user.stripeCustomerId,
              chargeId: typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : undefined,
              amountCharged: booking.price * 100, // total price of the service
              amountPaid: amountToCharge,
              amountRemaining: 0,
              paymentType: booking.paymentType === 'onCompletion' ? 'full' : 'final',
              billingReason: 'Service completed',
              currency: 'usd',
              couponId: booking.discountId ?? undefined,
              couponApplied: !!booking.discountId,
            });

            const rewardPoints = Math.floor(booking.price / 10);
            user.rewardPoints = user.rewardPoints += rewardPoints;
          
            await transaction.save({ session });
          }

        booking.barberIsComplete = true;
        booking.barberCompleteTime = new Date();
        booking.bookingStatus = 'completed';
        booking.remainingAmount = 0;
          
        await booking.save({ session });
        await barber.save({ session });

        await session.commitTransaction();
        session.endSession();
    
        if(booking.customerId){
            io.to(String(booking.customerId)).emit(Notifications.BARBER_COMPLETED_APPOINTMENT, {
                completeTime: booking.barberCompleteTime.toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',    
                    hour12: true,
                }),
                message: `${booking.barberName} completed your appointment.`,
            })
        }

        res.status(200).json({ message: 'Successfully updated booking as completed.', ok: true })
    } catch(err) {
        await session.abortTransaction();
        session.endSession();
        let isCardError = false;
        // handle card errors
        if(err instanceof Stripe.errors.StripeCardError) {
          // emit to user and barber?
          isCardError = true;
        // push notification to CUSTOMER
        }
        console.log(err)
        res.status(500).json({ error: 'Error updating booking status ' + err, ok: false, isCardError })
    }


}