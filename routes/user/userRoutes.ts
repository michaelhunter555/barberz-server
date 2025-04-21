import { Router } from 'express';
import getSingleUser from '../../controllers/users/get/get-single-user';
import updateGeolocation from '../../controllers/users/update/update-geolocation'

const router = Router();

router.post("/update-coordinates", updateGeolocation)
router.post("/get-user-account", getSingleUser);

export default router;