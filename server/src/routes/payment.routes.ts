import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
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
                method: method || 'UPI',
                gateway: 'RAZORPAY',
                transactionId: 'TXN_' + uuidv4().slice(0, 12).toUpperCase(),
                status: 'PENDING',
                isInstallment: useInstallment || false,
                installmentNumber
            }
        });

        // Mock Razorpay order
        const mockOrder = {
            id: 'order_' + uuidv4().slice(0, 16),
            amount: amount * 100, // paise
            currency: 'INR',
            receipt: payment.transactionId
        };

        res.json({ payment, order: mockOrder, expiresAt: seatExpiresAt });
    } catch (err) { next(err); }
});

// Verify payment (mock)
router.post('/verify', async (req: AuthRequest, res, next) => {
    try {
        const { paymentId, gatewayPaymentId, gatewaySignature } = req.body;
        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new AppError('Payment not found', 404);

        // Mock verification - always succeeds in mock mode
        const mockGatewayId = gatewayPaymentId || 'pay_' + uuidv4().slice(0, 16);
        const mockSignature = gatewaySignature || 'sig_mock_' + uuidv4().slice(0, 12);

        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'SUCCESS',
                gatewayPaymentId: mockGatewayId,
                gatewaySignature: mockSignature,
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
                userId: req.user!.id, action: 'PAYMENT_SUCCESS', entity: 'Payment', entityId: paymentId,
                details: JSON.stringify({ amount: payment.amount, method: payment.method })
            }
        });

        // Generate receipt and send PDF notification
        const rp = await import('../lib/notifications');
        const rcpNo = rp.generateReceiptNumber();
        const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

        await prisma.payment.update({
            where: { id: paymentId },
            data: { receiptUrl: `/receipts/${rcpNo}.pdf` } // Mock URL
        });

        await rp.sendNotification({
            userId: req.user!.id,
            title: 'Payment Successful',
            message: `Your payment of ₹${payment.amount} via ${payment.method} is successful. Receipt No: ${rcpNo}`,
            type: 'PAYMENT',
            link: `/payments`
        });

        res.json({ message: 'Payment successful! Seat confirmed.', transactionId: payment.transactionId, receipt: rcpNo });
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
