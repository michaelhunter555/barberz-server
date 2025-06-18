import { Router } from 'express';
import getSingleUser from '../../controllers/users/get/get-single-user';
import updateGeolocation from '../../controllers/users/update/update-geolocation'
import joinAsBarber from '../../controllers/users/update/join-as-barber';
import getNearestBarber from '../../controllers/users/get/get-nearest-barbers'

const router = Router();

router.get("/get-nearest-barbers", getNearestBarber);
router.post("/update-coordinates", updateGeolocation);
router.post("/get-user-account", getSingleUser);
router.post("/join-as-barber", joinAsBarber);

export default router;