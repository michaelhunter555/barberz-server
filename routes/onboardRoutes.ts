import express from 'express';

const router = express.Router();

// Stripe returns here after successful onboarding
router.get('/return', async (req, res) => {
  // You might fetch the account, verify status, etc. if needed

  // Then redirect to your app using a deep link
  res.redirect('myapp://onboarding-success');
});

// Stripe returns here if user cancels onboarding
router.get('/reauth', (req, res) => {
  res.redirect('myapp://onboarding-cancelled');
});

export default router;
