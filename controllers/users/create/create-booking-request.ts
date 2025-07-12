import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking, { IBookings } from '../../../models/Booking';
import Stripe from 'stripe';
import Transaction from '../../../models/Transaction';
import { TService } from '../../../models/Services';
import { io } from '../../../app';
import { Notifications } from '../../../types';
import { getBookingDateTime } from '../../../util/getBookingdateAndTime';
import { findUserById } from '../../../lib/database/findUserById';
import { generateOrderNumber } from '../../../util/bookingHelpers/orderNumberGenerator';

export default async function(req: Request, res: Response) {
    const { userId, bookingData, barberId } = req.body;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`)
    const platformFee = Number(process.env.PLATFORM_FEE);

    const {
        bookingDate,
        bookingTime,
        bookingLocation,
        addOns,
        discount,
        discountId,
        tip,
        price,
        serviceFee,
      } = bookingData ?? {};

      if (isNaN(platformFee)) {
          throw new Error('Invalid PLATFORM_FEE environment variable.');
        }

      if (typeof price !== 'number' || isNaN(price)) {
            return void res.status(400).json({ error: 'Invalid price value.', ok: false });
        }
          

      if (!bookingDate || !bookingTime || !bookingLocation || !price) {
        return void res.status(400).json({
          error: 'Missing required booking fields.',
          ok: false
        });
      }
      
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
          const user = await findUserById(String(userId), res);
          const barber = await findUserById(String(barberId), res);
          if(!user) {
              return void res.status(404).json({ error: 'User not found.', ok: false })
            }
            if(!barber) {
                return void res.status(404).json({ error: 'barber not found.', ok: false })
            }
            

        const bookingDateAndTime = getBookingDateTime(bookingDate, bookingTime);
        if (!bookingDateAndTime) {
        return void res.status(400).json({ error: 'Invalid booking date/time', ok: false });
        }

        const customer = await stripe.customers.retrieve(user.stripeCustomerId) as Stripe.Customer;
        console.log("customer Object:",customer)
        const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;

        if (!defaultPaymentMethod) {
            throw new Error('No payment method on file');
        }

        const totalCharge = Math.round(price * 100); // already includes service fee
        const baseAmount = Math.round((price - (serviceFee ?? 0)) * 100); // what barber earns

        let initialChargeAmount = 0;
        const serviceAmount = Math.round(baseAmount); // Stripe expects amounts in cents

        if (barber.paymentPolicy === 'payInFull') {
        initialChargeAmount = totalCharge;
        } else if (barber.paymentPolicy === 'halfNow') {
        initialChargeAmount = Math.round(totalCharge * 0.5);
        } 

        let paymentIntentId: string | null = null;
        let chargeId: string | null = null;
        if (initialChargeAmount > 0) {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: initialChargeAmount,
              currency: 'usd',
              customer: user.stripeCustomerId,
              payment_method: defaultPaymentMethod as string,
              off_session: true,
              capture_method: 'manual',
              confirm: true,
              metadata: {
                userId,
                barberId,
                policy: String(barber.paymentPolicy),
                tip: String(tip ?? 0),
                serviceFee: String(serviceFee ?? 0),
              },
              application_fee_amount: Math.floor(baseAmount * platformFee),
              transfer_data: {
                destination: barber.stripeAccountId
              },
              expand: ['latest_charge']
            });
          
            paymentIntentId = paymentIntent.id;
            chargeId = typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : "";

          }

          const bookingNumber = generateOrderNumber(String(user?._id))
          
        const createBooking: Partial<IBookings> = {
            bookingNumber,
            customerId: userId,
            customerName: user?.name,
            customerImg: user?.image,
            barberId,
            serviceFee: Number(serviceFee ?? 0),
            barberName: barber?.name,
            bookingDate: bookingDate,
            bookingTime: bookingTime,
            bookingDateAndTime,
            bookingLocation: bookingLocation,
            isConfirmed: false,
            addOns: Array.isArray(addOns) ? 
            addOns.filter(
                (a): a is TService =>
                  typeof a.name === 'string' &&
                  typeof a.description === 'string' &&
                  typeof a.price === 'number'
              ) : [],
            discount: discount,
            price: price,
            tip: tip ?? 0,
            platformFee: platformFee,
            barberIsStarted: false,
            barberStartTime: "",
            barberIsComplete: false,
            barberCompleteTime: "",
            customerConfirmComplete: false,
            bookingStatus: 'pending',
            paymentType: barber?.paymentPolicy ?? "onCompletion",
            cancelFee: barber?.cancelFee ?? 0,
            cancelFeeType: barber?.cancelFeeType ?? "number",
            initialPaymentIntentId: paymentIntentId ?? "",
            remainingAmount: barber.paymentPolicy === 'halfNow' || barber.paymentPolicy === 'onCompletion' 
              ? serviceAmount - initialChargeAmount 
              : 0
        }

        if (discountId && mongoose.Types.ObjectId.isValid(discountId)) {
            createBooking.discountId = discountId;
          }

        const newBooking = new Booking(createBooking);
        await newBooking.save({ session });

        if (initialChargeAmount > 0 && paymentIntentId) {
            const transaction = new Transaction({
                bookingNumber,
                bookingId: newBooking._id,
                serviceFee: Number(serviceFee ?? 0),
                userId: user._id,
                barberId: barber._id,
                amountCharged: serviceAmount,
                amountPaid: initialChargeAmount,
                amountRemaining: serviceAmount - initialChargeAmount,
                paymentType: barber.paymentPolicy === 'payInFull' ? 'full': 'deposit',
                billingReason: 'Provider Pre-booking requirement',
                currency: 'usd',
                couponId: mongoose.Types.ObjectId.isValid(discountId) ? discountId : undefined,
                couponApplied: !!discountId,
                stripePaymentIntentId: paymentIntentId,
                stripeCustomerId: user.stripeCustomerId,
                chargeId: chargeId,
            })

            await transaction.save({ session });
        }

        barber.requestedBooking = Number(barber?.requestedBooking ?? 0) + 1;
        barber.customerBookings?.push(newBooking._id);
        user.myBookings?.push(newBooking._id);
        user.userHasActiveBooking = !user.userHasActiveBooking;
        
        await barber.save({ session });
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        try{
            io.to(barberId).emit(Notifications.USER_APPOINTMENT_NOTIFICATION, {
                message: `Booking Request from ${user.name}`,
                appointment: {
                    _id: newBooking._id,
                    time: bookingTime,
                    date: bookingDate,
                    price: price,
                    customerName: user.name,
                    customerId: user._id,
                    customerImg: user.image,
                    location: bookingLocation,
                    tip: tip ?? 0,
                    discount: discount ?? 0,
                    addOns: createBooking.addOns,
                    status: 'pending',
                  }
              });

        } catch(err) {
            console.log("Notification failed: ", err);
        }
        
        res.status(201).json({ newBooking, ok: true });
    } catch(err) {
        await session.abortTransaction();
        session.endSession();
        let isCardError = false;
        if(err instanceof Stripe.errors.StripeCardError) {
          isCardError = true;
        }
        console.log(err);
        res.status(500).json({ error: 'Error creating booking. ' + err, ok: false, isCardError  });
    }
}