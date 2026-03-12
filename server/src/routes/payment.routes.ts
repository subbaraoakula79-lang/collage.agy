import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import stripe from '../lib/stripe';
import express from 'express';

const router = Router();

// Handle Stripe Webhook (Must be placed BEFORE express.json() / authenticate middleware parse the body)
// In a real app, you might need to adjust your app.ts to use raw body parser for this route specifically.
// Assuming for now we can access raw body or we'll parse it simply.
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test'; // Needs to be configured in .env

    let event;

    try {
        // Since express.json() might have already run in app.ts, req.body might be an object
        // If it fails here, you need to configure express.raw() in app.ts for /api/payment/webhook
        const bodyBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
        event = stripe.webhooks.constructEvent(bodyBuffer, sig as string, endpointSecret);
    } catch (err: any) {
        console.error('Webhook Error:', err.message);
        // Fallback for local testing (unsafe for prod without real signature verification)
        if (process.env.NODE_ENV !== 'production' && req.body.type) {
            event = req.body;
        } else {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const paymentId = session.client_reference_id;

        if (paymentId) {
            try {
                const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
                if (payment && payment.status === 'PENDING') {
                    await prisma.payment.update({
                        where: { id: paymentId },
                        data: {
                            status: 'SUCCESS',
                            gatewayPaymentId: session.id,
                            gatewaySignature: session.payment_intent as string || '',
                            paidAt: new Date()
                        }
                    });

                    // Confirm seat
                    if (payment.allotmentId) {
                        await prisma.allotment.update({
                            where: { id: payment.allotmentId },
                            data: { seatLocked: false, status: 'ACCEPTED' }
                        });
                    }

                    await prisma.auditLog.create({
                        data: {
                            userId: payment.studentId, // We don't have req.user here, use studentId
                            action: 'PAYMENT_SUCCESS', entity: 'Payment', entityId: paymentId,
                            details: JSON.stringify({ amount: payment.amount, method: 'STRIPE' })
                        }
                    });

                    // Generate receipt and send PDF notification
                    const rp = await import('../lib/notifications');
                    const rcpNo = rp.generateReceiptNumber();

                    const profile = await prisma.studentProfile.findUnique({ where: { id: payment.studentId } });
                    if (profile) {
                        await rp.sendNotification({
                            userId: profile.userId,
                            title: 'Payment Successful',
                            message: `Your payment of ₹${payment.amount} is successful. Receipt No: ${rcpNo}`,
                            type: 'PAYMENT',
                            link: `/payments`
                        });
                    }

                    await prisma.payment.update({
                        where: { id: paymentId },
                        data: { receiptUrl: `/receipts/${rcpNo}.pdf` } // Mock URL
                    });
                }
            } catch (err) {
                console.error('Error processing webhook:', err);
            }
        }
    }

    res.json({ received: true });
});

router.use(authenticate);

// Initiate payment
router.post('/initiate', async (req: AuthRequest, res, next) => {
    try {
        const { allotmentId, method, useInstallment } = req.body;
        const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
        if (!profile) throw new AppError('Profile not found');

        const allotment = await prisma.allotment.findUnique({
            where: { id: allotmentId },
            include: { course: true }
        });
        if (!allotment) throw new AppError('Allotment not found', 404);
        if (allotment.status !== 'ACCEPTED' && allotment.status !== 'FROZEN') {
            throw new AppError('Accept or freeze seat before payment');
        }

        // Lock seat for 15 min
        const seatExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await prisma.allotment.update({
            where: { id: allotmentId },
            data: { seatLocked: true, seatLockedAt: new Date(), seatExpiresAt }
        });

        let amount = allotment.course.totalFee;
        let installmentNumber = 1;

        if (useInstallment && allotment.course.installmentEnabled) {
            amount = Math.ceil(allotment.course.totalFee / 2); // 50% first installment
        }

        const payment = await prisma.payment.create({
            data: {
                studentId: profile.id,
                allotmentId,
                amount,
                method: method || 'CARD',
                gateway: 'STRIPE',
                transactionId: 'TXN_' + uuidv4().slice(0, 12).toUpperCase(),
                status: 'PENDING',
                isInstallment: useInstallment || false,
                installmentNumber
            }
        });

        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: `Fee for ${allotment.course.name}`,
                            description: `Transaction ID: ${payment.transactionId}`
                        },
                        unit_amount: amount * 100, // Stripe expects amount in smallest currency unit (paise)
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&payment_id=${payment.id}`,
            cancel_url: `${FRONTEND_URL}/payment-cancel?payment_id=${payment.id}`,
            client_reference_id: payment.id, // We'll use this in the webhook to identify the payment
            customer_email: req.user!.email,
        });

        res.json({
            payment,
            checkoutUrl: session.url, // Send the URL back to the frontend to redirect
            sessionId: session.id,
            expiresAt: seatExpiresAt
        });
    } catch (err) { next(err); }
});

// Verify payment (mock wrapper for frontend immediate feedback)
// Stripe webhook is the source of truth, but this allows frontend to aggressively check status
router.post('/verify', async (req: AuthRequest, res, next) => {
    try {
        const { paymentId, sessionId } = req.body;
        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new AppError('Payment not found', 404);

        if (payment.status === 'SUCCESS') {
            // Webhook already processed it
            return res.json({ message: 'Payment successful! Seat confirmed.', transactionId: payment.transactionId, receipt: payment.receiptUrl });
        }

        // Check Stripe Session directly if webhook hasn't fired yet
        if (sessionId) {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            if (session.payment_status === 'paid') {
                // Duplicate the success logic from webhook to assure frontend 
                await prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: 'SUCCESS',
                        gatewayPaymentId: session.id,
                        paidAt: new Date()
                    }
                });

                if (payment.allotmentId) {
                    await prisma.allotment.update({
                        where: { id: payment.allotmentId },
                        data: { seatLocked: false, status: 'ACCEPTED' }
                    });
                }

                const rp = await import('../lib/notifications');
                const rcpNo = rp.generateReceiptNumber();
                await prisma.payment.update({
                    where: { id: paymentId },
                    data: { receiptUrl: `/receipts/${rcpNo}.pdf` } // Mock URL
                });

                return res.json({ message: 'Payment successful! Seat confirmed.', transactionId: payment.transactionId, receipt: rcpNo });
            }
        }

        throw new AppError('Payment not yet verified or failed', 400);

    } catch (err) { next(err); }
});

// Get payment status
router.get('/:id', async (req: AuthRequest, res, next) => {
    try {
        const payment = await prisma.payment.findUnique({ where: { id: req.params.id as string } });
        if (!payment) throw new AppError('Payment not found', 404);
        res.json(payment);
    } catch (err) { next(err); }
});

export default router;
