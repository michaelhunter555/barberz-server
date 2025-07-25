import { Router } from 'express';
import getSingleUser from '../../controllers/users/get/get-single-user';
import updateGeolocation from '../../controllers/users/update/update-geolocation'
import joinAsBarber from '../../controllers/users/update/join-as-barber';
import getNearestBarber from '../../controllers/users/get/get-nearest-barbers'
import getSelectedBarber from '../../controllers/users/get/get-selected-barber';
import createBookingRequest from '../../controllers/users/create/create-booking-request';
import getMyBookings from '../../controllers/users/get/get-my-bookings';
import createReview from '../../controllers/users/create/create-review';
import fileUpload from '../../middleware/file-upload';
import setupIntents from '../../controllers/users/create/setup-intents';
import getStripePaymentMethods from '../../controllers/users/get/get-stripe-payment-methods';
import updateDefaultPayment from '../../controllers/users/update/update-default-payment';
import cancelBooking from '../../controllers/users/update/cancel-booking';
import getTransactions from '../../controllers/users/get/get-transactions';
import createDispute from '../../controllers/users/create/create-dispute';
import getDisputeById from '../../controllers/users/get/get-dispute-by-id';
import getDisputes from '../../controllers/users/get/get-disputes';
import deletePaymentMethod from '../../controllers/users/delete/delete-payment-method';
import createAppLevelCoupon from '../../controllers/users/create/create-app-level-coupon';
import favoriteProviders from '../../controllers/users/update/favorite-providers';
import removeFavorite from '../../controllers/users/update/remove-favorite';
import myFavorites from '../../controllers/users/get/my-favorites';

const router = Router();

router.get("/get-nearest-barbers", getNearestBarber);
router.get("/get-one-barber", getSelectedBarber);
router.get("/get-my-bookings", getMyBookings);
router.get("/setup-intents", setupIntents);
router.get("/get-stripe-payment-methods", getStripePaymentMethods);
router.get("/get-transactions", getTransactions);
router.get("/get-dispute-by-id", getDisputeById);
router.get("/get-disputes", getDisputes);
router.get("/get-favorites", myFavorites);

router.post("/add-favorite-provider", favoriteProviders);
router.post("/remove-favorite-provider", removeFavorite);
router.post("/create-app-level-coupon", createAppLevelCoupon);
router.post("/cancel-booking", cancelBooking);
router.post("/update-default-payment", updateDefaultPayment)
router.post("/update-coordinates", updateGeolocation);
router.post("/get-user-account", getSingleUser);
router.post("/join-as-barber", fileUpload.fields([
  {name: 'imageIdFront', maxCount: 1},
  {name: 'imageIdBack', maxCount: 1}
]), joinAsBarber);
router.post("/create-booking-request", createBookingRequest);
router.post("/create-dispute",fileUpload.fields([
  {name: 'imageOne', maxCount: 1},
  {name: 'imageTwo', maxCount: 1}
]), createDispute);
router.post("/create-user-review",
    fileUpload.fields([
        { name: 'imageOne', maxCount: 1 },
        { name: 'imageTwo', maxCount: 1 },
        { name: 'imageThree', maxCount: 1 },
      ]), 
    createReview
);

router.delete("/delete-payment-method", deletePaymentMethod);

export default router;