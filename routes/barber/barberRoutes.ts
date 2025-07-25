import { Router } from "express";
import updateStartingPrice from "../../controllers/barbers/update/update-starting-price";
import updateVisibilty from "../../controllers/barbers/update/update-visibilty";
import createCoupon from "../../controllers/barbers/create/create-coupon";
import getCoupons from "../../controllers/barbers/get/get-coupons";
import editCoupon from "../../controllers/barbers/update/update-coupon";
import deleteCoupon from "../../controllers/barbers/delete/delete-coupon";
import getAddOns from "../../controllers/barbers/get/get-add-on";
import createService from "../../controllers/barbers/create/create-service";
import deleteService from "../../controllers/barbers/delete/delete-service";
import updateService from "../../controllers/barbers/update/update-service";
import getSchedule from "../../controllers/barbers/get/get-schedule";
import addTimeSlot from "../../controllers/barbers/create/add-time-slot";
import updateSingleTimeslot from "../../controllers/barbers/update/update-single-timeslot";
import deleteTimeSlot from "../../controllers/barbers/delete/delete-time-slot";
import clearSchedule from "../../controllers/barbers/delete/clear-schedule";
import updateUserBio from "../../controllers/barbers/update/update-user-bio";
import createStripeAccount from "../../controllers/barbers/create/create-stripe-account";
import confirmOnboard from "../../controllers/barbers/get/confirm-onboard";
import updateShowcase from "../../controllers/barbers/update/update-showcase";
import fileUpload from "../../middleware/file-upload";
import updatePrimaryLocation from "../../controllers/barbers/update/update-primary-location";
import getBookings from "../../controllers/barbers/get/get-bookings";
import bookingRequestResponse from "../../controllers/barbers/update/booking-request-response";
import getBookingById from "../../controllers/barbers/get/get-booking-by-id";
import markBookingStarted from "../../controllers/barbers/update/mark-booking-started";
import markBookingCompleted from "../../controllers/barbers/update/mark-booking-completed";
import getReviews from "../../controllers/barbers/get/get-reviews";
import getReviewById from "../../controllers/barbers/get/get-review-by-id";
import updateBookingPolicy from "../../controllers/barbers/update/update-booking-policy";
import getUpcomingBookings from "../../controllers/barbers/get/get-upcoming-bookings";
import cancelConfirmedBooking from "../../controllers/barbers/update/cancel-confirmed-booking";
import getPayoutInfo from "../../controllers/barbers/get/get-payout-info";
import updateBookingWithImage from "../../controllers/barbers/update/update-booking-with-image";
import disputeResponse from "../../controllers/barbers/update/dispute-response";
import getBookedSlotsForDate from "../../controllers/barbers/get/get-booked-slots-for-date";
import updateProfilePhoto from "../../controllers/barbers/update/update-profile-photo";
import getPerformanceData from "../../controllers/barbers/get/get-performance-data";

const router = Router();

router.get("/get-coupons", getCoupons);
router.get("/get-add-ons", getAddOns);
router.get("/get-schedule", getSchedule);
router.get("/get-bookings", getBookings);
router.get("/create-stripe-account", createStripeAccount);
router.get("/confirm-onboarding", confirmOnboard);
router.get("/get-booking-by-id", getBookingById);
router.get("/mark-booking-started", markBookingStarted);
router.get("/mark-booking-completed", markBookingCompleted);
router.get("/get-barber-reviews", getReviews);
router.get("/get-review-by-id", getReviewById);
router.get("/get-upcoming-bookings", getUpcomingBookings);
router.get("/get-payment-settings", getPayoutInfo);
router.get("/get-booked-slots-for-date", getBookedSlotsForDate);
router.get("/get-performance-data", getPerformanceData);

router.post("/cancel-confirmed-booking", cancelConfirmedBooking);
router.post("/update-booking-policy", updateBookingPolicy);
router.post("/update-bio", updateUserBio);
router.post("/booking-request-response", bookingRequestResponse);
router.post("/update-primary-location", updatePrimaryLocation);
router.post("/clear-schedule", clearSchedule);
router.post("/edit-time-slot", updateSingleTimeslot)
router.post("/add-time-slot", addTimeSlot);
router.post("/create-add-on", createService);
router.post("/update-add-on", updateService);
router.post("/update-starting-price", updateStartingPrice);
router.post("/update-visibility", updateVisibilty);
router.post("/create-coupon", createCoupon);
router.post("/edit-coupon", editCoupon);
router.post("/respond-to-dispute", disputeResponse);
router.post("/add-post-completion-img",fileUpload.single('proofOfCompletionImg') ,updateBookingWithImage);
router.post("/update-profile-photo", fileUpload.single('profilePhoto'), updateProfilePhoto);
router.post(
    "/update-image-gallery", 
    fileUpload.fields([
  { name: 'imageOne' },
  { name: 'imageTwo' },
  { name: 'imageThree' },
  { name: 'imageFour' },
  { name: 'imageFive' },
  { name: 'imageSix' },
    ]), 
    updateShowcase
);

router.delete("/delete-coupon", deleteCoupon);
router.delete("/delete-add-on", deleteService);
router.delete("/delete-time-slot", deleteTimeSlot);

export default router;