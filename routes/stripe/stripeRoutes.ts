import { Router } from 'express';
import getPubKey from '../../controllers/stripe/getPubKey';

const router = Router();

router.get("/get-stripe-pub", getPubKey);

export default router;