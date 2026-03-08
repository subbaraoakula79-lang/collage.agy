import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { runMeritAllocation } from '../lib/meritAllocation';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN'));

// Dashboard stats
router.get('/dashboard', async (_req: AuthRequest, res, next) => {
    try {
        const [totalStudents, totalFaculty, totalCourses, totalApplications, totalPayments, totalAllotments] = await Promise.all([
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: 'FACULTY' } }),
            prisma.course.count(),
            prisma.application.count(),
            prisma.payment.count({ where: { status: 'SUCCESS' } }),
            prisma.allotment.count({ where: { status: { in: ['ACCEPTED', 'FROZEN'] } } })
        ]);

        const revenue = await prisma.payment.aggregate({
            where: { status: 'SUCCESS' },
            _sum: { amount: true }
        });

        res.json({
            totalStudents, totalFaculty, totalCourses, totalApplications,
            totalPayments, totalAllotments, totalRevenue: revenue._sum.amount || 0
        });
    } catch (err) { next(err); }
});

// Get all users
router.get('/users', async (req: AuthRequest, res, next) => {
    try {
        const { role } = req.query;
        const where: any = {};
        if (role) where.role = role;

        const users = await prisma.user.findMany({
            where,
            select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (err) { next(err); }
});

// Get all courses with stats
router.get('/courses', async (_req: AuthRequest, res, next) => {
    try {
        const courses = await prisma.course.findMany({
            include: {
                college: true,
                reservations: true,
                _count: { select: { applications: true, allotments: true } }
            }
        });
        res.json(courses);
    } catch (err) { next(err); }
});

// Get audit logs
router.get('/audit-logs', async (req: AuthRequest, res, next) => {
    try {
        const { entity, action } = req.query;
        const where: any = {};
        if (entity) where.entity = entity;
        if (action) where.action = action;

        const logs = await prisma.auditLog.findMany({
            where,
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(logs);
    } catch (err) { next(err); }
});

// Get all payments
router.get('/payments', async (_req: AuthRequest, res, next) => {
    try {
        const payments = await prisma.payment.findMany({
            include: { student: { include: { user: { select: { name: true, email: true } } } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(payments);
    } catch (err) { next(err); }
});

// Initiate refund
router.post('/refund', async (req: AuthRequest, res, next) => {
    try {
        const { paymentId, reason } = req.body;
        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new AppError('Payment not found', 404);
        if (payment.status !== 'SUCCESS') throw new AppError('Can only refund successful payments');

        const refund = await prisma.refund.create({
            data: { paymentId, amount: payment.amount, reason, status: 'PROCESSED', processedAt: new Date(), processedBy: req.user!.id }
        });

        await prisma.payment.update({ where: { id: paymentId }, data: { status: 'REFUNDED' } });

        await prisma.auditLog.create({
            data: { userId: req.user!.id, action: 'REFUND', entity: 'Payment', entityId: paymentId, details: JSON.stringify({ amount: payment.amount, reason }) }
        });

        res.json(refund);
    } catch (err) { next(err); }
});

// Get all allotments
router.get('/allotments', async (_req: AuthRequest, res, next) => {
    try {
        const allotments = await prisma.allotment.findMany({
            include: {
                student: { include: { user: { select: { name: true, email: true } } } },
                course: { include: { college: true } },
                round: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(allotments);
    } catch (err) { next(err); }
});

// Colleges CRUD
router.post('/colleges', async (req: AuthRequest, res, next) => {
    try {
        const { name, code, accessCode, address, city, state } = req.body;
        const college = await prisma.college.create({
            data: {
                name,
                code,
                accessCode: accessCode || '86390',
                address,
                city,
                state: state || 'Andhra Pradesh'
            }
        });
        res.status(201).json(college);
    } catch (err) { next(err); }
});

router.get('/colleges', async (_req: AuthRequest, res, next) => {
    try {
        const colleges = await prisma.college.findMany({
            select: {
                id: true, name: true, code: true, accessCode: true, address: true, city: true, state: true,
                _count: { select: { courses: true, faculty: true } }
            }
        });
        res.json(colleges);
    } catch (err) { next(err); }
});

// Analytics endpoint
router.get('/analytics', async (_req: AuthRequest, res, next) => {
    try {
        const [categoryBreakdown, genderBreakdown, districtBreakdown, statusBreakdown] = await Promise.all([
            prisma.studentProfile.groupBy({ by: ['category'], _count: { id: true } }),
            prisma.studentProfile.groupBy({ by: ['gender'], _count: { id: true } }),
            prisma.studentProfile.groupBy({ by: ['district'], _count: { id: true } }),
            prisma.application.groupBy({ by: ['status'], _count: { id: true } })
        ]);

        const courses = await prisma.course.findMany({
            select: { id: true, name: true, code: true, totalSeats: true, _count: { select: { applications: true, allotments: true } } }
        });

        const courseFillRate = courses.map(c => ({
            name: c.name, code: c.code, totalSeats: c.totalSeats,
            applications: c._count.applications, allotments: c._count.allotments,
            fillRate: c.totalSeats > 0 ? Math.round((c._count.allotments / c.totalSeats) * 100) : 0
        }));

        res.json({
            categoryBreakdown: categoryBreakdown.map(c => ({ category: c.category, count: c._count.id })),
            genderBreakdown: genderBreakdown.map(g => ({ gender: g.gender || 'Unknown', count: g._count.id })),
            districtBreakdown: districtBreakdown.filter(d => d.district).map(d => ({ district: d.district, count: d._count.id })),
            statusBreakdown: statusBreakdown.map(s => ({ status: s.status, count: s._count.id })),
            courseFillRate
        });
    } catch (err) { next(err); }
});

// ==========================================
// ALLOTMENT ROUNDS MANAGEMENT (Admin only)
// ==========================================

// Get all rounds across all courses
router.get('/rounds', async (_req: AuthRequest, res, next) => {
    try {
        const rounds = await prisma.round.findMany({
            include: {
                course: { include: { college: true, reservations: true, _count: { select: { applications: true, allotments: true } } } },
                allotments: { select: { id: true, status: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Also return courses without any rounds (for starting new ones)
        const courses = await prisma.course.findMany({
            include: {
                college: true,
                reservations: true,
                rounds: { orderBy: { roundNumber: 'desc' }, take: 1 },
                _count: { select: { applications: true, allotments: true } }
            }
        });

        res.json({ rounds, courses });
    } catch (err) { next(err); }
});

// Get all admission phases
router.get('/rounds/phases', async (_req: AuthRequest, res, next) => {
    try {
        const phases = await prisma.admissionPhase.findMany();
        res.json(phases);
    } catch (err) { next(err); }
});

// Schedule allotment round dates (by admissionType)
router.post('/rounds/schedule', async (req: AuthRequest, res, next) => {
    try {
        const { admissionType, startDate, endDate } = req.body;
        if (!admissionType || !startDate || !endDate) {
            throw new AppError('Admission type, start date, and end date are required');
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end <= start) throw new AppError('End date must be after start date');

        const phase = await prisma.admissionPhase.upsert({
            where: { admissionType },
            update: { startDate: start, endDate: end },
            create: { admissionType, startDate: start, endDate: end }
        });

        // Store schedule in audit log for tracking
        await prisma.auditLog.create({
            data: {
                userId: req.user!.id,
                action: 'SCHEDULE_PHASE',
                entity: 'AdmissionPhase',
                entityId: phase.id,
                details: JSON.stringify({ startDate, endDate, admissionType })
            }
        });

        res.json({ message: `Allotment dates configured for ${admissionType} from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}` });
    } catch (err) { next(err); }
});

// Start admission round for a course
router.post('/rounds/:courseId/start', async (req: AuthRequest, res, next) => {
    try {
        const course = await prisma.course.findUnique({
            where: { id: req.params.courseId as string },
            include: { reservations: true, rounds: { orderBy: { roundNumber: 'desc' } } }
        });
        if (!course) throw new AppError('Course not found', 404);
        if (course.reservations.length === 0) throw new AppError('Set reservation matrix first');

        const nextRoundNumber = (course.rounds[0]?.roundNumber || 0) + 1;
        if (nextRoundNumber > 3) throw new AppError('Maximum 3 rounds allowed');

        if (course.rounds[0] && course.rounds[0].status !== 'COMPLETED') {
            throw new AppError('Complete current round before starting next');
        }

        const round = await prisma.round.create({
            data: { courseId: req.params.courseId as string, roundNumber: nextRoundNumber, status: 'IN_PROGRESS', startedAt: new Date() }
        });

        const result = await runMeritAllocation(course, round);

        await prisma.auditLog.create({
            data: { userId: req.user!.id, action: 'START_ROUND', entity: 'Round', entityId: round.id, details: JSON.stringify({ courseId: course.id, roundNumber: nextRoundNumber, allotments: result.length }) }
        });

        res.json({ round, allotments: result });
    } catch (err) { next(err); }
});

// Complete round for a course
router.post('/rounds/:courseId/complete', async (req: AuthRequest, res, next) => {
    try {
        const round = await prisma.round.findFirst({
            where: { courseId: req.params.courseId as string, status: 'IN_PROGRESS' }
        });
        if (!round) throw new AppError('No active round for this course');

        await prisma.round.update({
            where: { id: round.id },
            data: { status: 'COMPLETED', completedAt: new Date() }
        });

        await prisma.allotment.updateMany({
            where: { roundId: round.id, status: 'ALLOTTED' },
            data: { status: 'CANCELLED' }
        });

        await prisma.auditLog.create({
            data: { userId: req.user!.id, action: 'COMPLETE_ROUND', entity: 'Round', entityId: round.id }
        });

        res.json({ message: `Round ${round.roundNumber} completed` });
    } catch (err) { next(err); }
});

// Publish round results
router.post('/rounds/:courseId/publish', async (req: AuthRequest, res, next) => {
    try {
        const round = await prisma.round.findFirst({
            where: { courseId: req.params.courseId as string, status: 'IN_PROGRESS' }
        });
        if (!round) {
            const lastRound = await prisma.round.findFirst({
                where: { courseId: req.params.courseId as string, status: 'COMPLETED', isPublished: false },
                orderBy: { roundNumber: 'desc' }
            });
            if (!lastRound) throw new AppError('No unpublished round results found');

            await prisma.round.update({ where: { id: lastRound.id }, data: { isPublished: true } });

            const allotments = await prisma.allotment.findMany({
                where: { roundId: lastRound.id, status: 'ALLOTTED' },
                include: { student: true, course: { include: { college: true } } }
            });

            const rp = await import('../lib/notifications');
            for (const a of allotments) {
                await rp.sendNotification({
                    userId: a.student.userId,
                    title: 'Allotment Results Published!',
                    message: `Congratulations! You have been allotted a seat in ${a.course.name} at ${a.course.college.name}. Please visit the Seat Allotments section to accept or freeze your seat.`,
                    type: 'ALLOTMENT',
                    link: '/allotments'
                });
            }

            return res.json({ message: 'Results published and notifications sent' });
        }

        await prisma.round.update({
            where: { id: round.id },
            data: { status: 'COMPLETED', completedAt: new Date(), isPublished: true }
        });

        const allotments = await prisma.allotment.findMany({
            where: { roundId: round.id, status: 'ALLOTTED' },
            include: { student: true, course: true }
        });

        const rp = await import('../lib/notifications');
        for (const a of allotments) {
            await rp.sendNotification({
                userId: a.student.userId,
                title: 'Allotment Results Published!',
                message: `Congratulations! You have been allotted a seat in ${a.course.name} (Round ${round.roundNumber}). Please accept or freeze your seat.`,
                type: 'ALLOTMENT',
                link: '/allotments'
            });
        }

        await prisma.auditLog.create({
            data: { userId: req.user!.id, action: 'PUBLISH_RESULTS', entity: 'Round', entityId: round.id }
        });

        res.json({ message: `Round ${round.roundNumber} results published and notifications sent` });
    } catch (err) { next(err); }
});

export default router;
