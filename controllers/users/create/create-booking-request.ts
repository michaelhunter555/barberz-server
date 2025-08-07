import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking, { IBookings } from '../../../models/Booking';
import Stripe from 'stripe';
import Transaction from '../../../models/Transaction';
import { TService } from '../../../models/Services';
import { io } from '../../../app';
import { App, Notifications } from '../../../types';
import { getBookingDateTime } from '../../../util/getBookingdateAndTime';
import { findUserById } from '../../../lib/database/findUserById';
import { generateOrderNumber } from '../../../util/bookingHelpers/orderNumberGenerator';
import Chat from '../../../models/Chat';
import expo, { isExpoPushToken } from '../../../util/ExpoNotifications';
import { checkRoom } from '../../../util/checkRoomHelper';

const placeholderImage = 'https://res.cloudinary.com/dbbwuklgb/image/upload/v1753549795/placeholder_bkidl9.png';

export default async function(req: Request, res: Response) {
    const { userId, bookingData, barberId } = req.body;
    const stripe = new Stripe(`${process.env.STRIPE_TEST_SECRET_KEY}`);
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
        const bookingNumber = generateOrderNumber(String(user?._id));
        if (!bookingDateAndTime) {
        return void res.status(400).json({ error: 'Invalid booking date/time', ok: false });
        }

        const customer = await stripe.customers.retrieve(user.stripeCustomerId) as Stripe.Customer;
        console.log("customer Object:",customer)
        const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;

        if (!defaultPaymentMethod) {
            throw new Error('No payment method on file');
        }

        const fraction = barber.paymentPolicy === 'halfNow' ? 0.5 : 1;
        const recordedServiceFee = serviceFee * fraction;
        const totalCharge = Math.round(price * 100);
        const baseAmount = Math.round((price - serviceFee) * 100);
        let initialChargeAmount = 0;
        let remainingAmount = totalCharge;

        const serviceAmount = Math.round(baseAmount); // Stripe expects amounts in cents

        if (barber.paymentPolicy === 'payInFull') {
        initialChargeAmount = totalCharge;
        remainingAmount = 0;
        } else if (barber.paymentPolicy === 'halfNow') {
        initialChargeAmount = Math.round(totalCharge * 0.5);
        remainingAmount = Math.round(totalCharge * 0.5);
        } 

        const platformCut = baseAmount * fraction * platformFee;
        const applicationFee = Math.floor(recordedServiceFee * 100 + platformCut);

        const createBooking: Partial<IBookings> = {
          bookingNumber,
          customerId: userId,
          customerName: user?.name,
          customerImg: user?.image,
          barberImg: barber?.image,
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
          // initialPaymentIntentId: paymentIntentId ?? "", // <-- update this
          remainingAmount: barber.paymentPolicy === 'halfNow' || barber.paymentPolicy === 'onCompletion' 
            ? remainingAmount 
            : 0
      }
        const newBooking = new Booking(createBooking);

        const transaction = {
          amountCharged: serviceAmount, // barber charge
          amountRemaining: remainingAmount,
          paymentType: barber.paymentPolicy === 'payInFull' ? 'full': 'deposit',
          couponId: mongoose.Types.ObjectId.isValid(discountId) ? discountId : undefined,
          couponApplied: !!discountId,
      }
        if (initialChargeAmount > 0) {
             await stripe.paymentIntents.create({
              amount: initialChargeAmount,
              currency: 'usd',
              customer: user.stripeCustomerId,
              payment_method: defaultPaymentMethod as string,
              off_session: true,
              capture_method: 'manual',
              confirm: true,
              metadata: {
                bookingId: String(newBooking._id),
                transaction: JSON.stringify(transaction),
                userId,
                barberId,
                bookingNumber,
                policy: String(barber.paymentPolicy),
                tip: String(tip ?? 0),
                serviceFee: recordedServiceFee,
              },
              application_fee_amount: applicationFee,
              transfer_data: {
                destination: barber.stripeAccountId
              },
              expand: ['latest_charge']
            });
           }

        if (discountId && mongoose.Types.ObjectId.isValid(discountId)) {
            createBooking.discountId = discountId;
          }

          const chat = new Chat({
            bookingId: newBooking._id,
            participants: [barber._id, user._id],
            participantInfo: [{
              id: user._id,
              name: user?.name,
              image: user?.image ?? placeholderImage,
              role: 'user',
            },
            {
              id: barber._id,
              name: barber?.name,
              image: barber?.image ?? placeholderImage,
              role: 'barber',
            }
          ],
          createdAt: new Date(),
        });
        await chat.save({ session });
  
        newBooking.chatId = chat._id;

      await newBooking.save({ session })
      await session.commitTransaction();
        session.endSession();

      // only onCompletion Notifications  
      const isOnCompletion = barber?.paymentPolicy === 'onCompletion'
        const isOnline = checkRoom(io, String(barberId));
        if(barberId && isOnline && isOnCompletion ) {
          io.to(String(barberId)).emit(Notifications.USER_APPOINTMENT_NOTIFICATION, {
              message: `Booking Request from ${user.name}`,
              appointment: {
                  _id: newBooking._id,
                  time: bookingTime,
                  date: bookingDate,
                  price: price,
                  customerName: user.name,
                }
            });
        } else if(isOnCompletion && barber?.pushToken && isExpoPushToken(barber?.pushToken)) {
          await expo.sendPushNotificationsAsync([
            {
              to: barber?.pushToken,
              title: App.NAME,
              subtitle: `Booking Request - $${bookingData.price.toFixed(2)} ${bookingDate} @${bookingTime}`,
              body: `${user?.name} created a booking request. Please respond by accepting, rejecting or rescheduling this booking.`,
              data: {
                path: `/booking/${newBooking._id}`
              }
            }
          ])
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