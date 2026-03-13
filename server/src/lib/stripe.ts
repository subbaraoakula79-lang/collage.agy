import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2026-02-25.clover' // Use a generic recent API version or a fixed one
});

export default stripe;
