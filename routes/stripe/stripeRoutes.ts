import express, { Router } from 'express';
import getPubKey from '../../controllers/stripe/getPubKey';
import stripeWebhook from '../../controllers/stripe/stripe-webhook';

const router = Router();

router.get("/get-stripe-pub", getPubKey);

router.post("/stripe-webhook", express.raw({ type: "application/json" }), stripeWebhook);

export default router;