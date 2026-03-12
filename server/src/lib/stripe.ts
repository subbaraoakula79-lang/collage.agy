import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-10-28.acacia' // Use a generic recent API version or a fixed one
});

export default stripe;
