import { Router } from "express";
import updateStartingPrice from "../../controllers/barbers/update/update-starting-price";
import updateVisibilty from "../../controllers/barbers/update/update-visibilty";
import createCoupon from "../../controllers/barbers/create/create-coupon";
import getCoupons from "../../controllers/barbers/get/get-coupons";
import editCoupon from "../../controllers/barbers/update/update-coupon";
import deleteCoupon from "../../controllers/barbers/delete/delete-coupon";

const router = Router();

router.get("/get-coupons", getCoupons)
router.post("/update-starting-price", updateStartingPrice);
router.post("/update-visibility", updateVisibilty);
router.post("/create-coupon", createCoupon);
router.post("/edit-coupon", editCoupon);
router.delete("/delete-coupon", deleteCoupon);

export default router;