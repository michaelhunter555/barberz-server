import { Router } from 'express';
import getSingleUser from '../../controllers/users/get-single-user';

const router = Router();

router.post("/get-user-account", getSingleUser);

export default router;