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

const router = Router();

router.get("/get-coupons", getCoupons);
router.get("/get-add-ons", getAddOns);
router.get("/get-schedule", getSchedule);
router.post("/add-time-slot", addTimeSlot);
router.post("/create-add-on", createService);
router.post("/update-add-on", updateService);
router.post("/update-starting-price", updateStartingPrice);
router.post("/update-visibility", updateVisibilty);
router.post("/create-coupon", createCoupon);
router.post("/edit-coupon", editCoupon);
router.delete("/delete-coupon", deleteCoupon);
router.delete("/delete-add-on", deleteService);

export default router;