import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get all notifications for current user
router.get('/', async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (err) {
        next(err);
    }
});

// Mark all as read
router.post('/read-all', async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
