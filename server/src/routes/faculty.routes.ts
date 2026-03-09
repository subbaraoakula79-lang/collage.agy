import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);
router.use(authorize('FACULTY'));

// Get faculty profile with college
router.get('/profile', async (req: AuthRequest, res, next) => {
    try {
        const profile = await prisma.facultyProfile.findUnique({
            where: { userId: req.user!.id },
            include: { college: true, user: { select: { name: true, email: true } } }
        });
        res.json(profile);
    } catch (err) { next(err); }
});

// Link faculty to a college
router.post('/link-college', async (req: AuthRequest, res, next) => {
    try {
        const { collegeId, accessCode } = req.body;
        if (!collegeId || !accessCode) throw new AppError('College and access code required');

        const college = await prisma.college.findUnique({ where: { id: collegeId } });
        if (!college) throw new AppError('College not found', 404);

        if (college.accessCode !== accessCode) {
            throw new AppError('Invalid access code for this college', 403);
        }

        const updatedProfile = await prisma.facultyProfile.update({
            where: { userId: req.user!.id },
            data: { collegeId }
        });

        await prisma.auditLog.create({
            data: { userId: req.user!.id, action: 'LINK_COLLEGE', entity: 'FacultyProfile', entityId: updatedProfile.id, details: JSON.stringify({ collegeId }) }
        });

        res.json({ message: 'College linked successfully', profile: updatedProfile });
    } catch (err) { next(err); }
});

// Get all colleges (publicly available for linking)
router.get('/all-colleges', async (req: AuthRequest, res, next) => {
    try {
        const colleges = await prisma.college.findMany({
            select: { id: true, name: true, city: true, state: true }
        });
        res.json(colleges);
    } catch (err) { next(err); }
});

// Create course
router.post('/courses', async (req: AuthRequest, res, next) => {
    try {
        const profile = await prisma.facultyProfile.findUnique({ where: { userId: req.user!.id } });
        if (!profile?.collegeId) throw new AppError('Faculty must be linked to a college');

        const { name, code, admissionType, admissionMode, totalSeats, eligibilityPercentage,
            tuitionFee, labFee, libraryFee, otherFee, installmentEnabled, scholarshipEnabled, unfilledSeatRule } = req.body;

        const totalFee = (tuitionFee || 0) + (labFee || 0) + (libraryFee || 0) + (otherFee || 0);

        const course = await prisma.course.create({
            data: {
                name, code, collegeId: profile.collegeId, admissionType, admissionMode: admissionMode || 'MERIT',
                totalSeats, eligibilityPercentage: eligibilityPercentage || 0,
                tuitionFee: tuitionFee || 0, labFee: labFee || 0, libraryFee: libraryFee || 0,
                otherFee: otherFee || 0, totalFee,
                installmentEnabled: installmentEnabled || false, scholarshipEnabled: scholarshipEnabled || false,
                unfilledSeatRule: unfilledSeatRule || 'CONVERT_TO_GENERAL'
            }
        });

        await prisma.auditLog.create({
            data: { userId: req.user!.id, action: 'CREATE_COURSE', entity: 'Course', entityId: course.id, details: JSON.stringify({ name, totalSeats }) }
        });

        res.status(201).json(course);
    } catch (err) { next(err); }
});

// Get courses for faculty's college
router.get('/courses', async (req: AuthRequest, res, next) => {
    try {
        const profile = await prisma.facultyProfile.findUnique({ where: { userId: req.user!.id } });
        if (!profile?.collegeId) throw new AppError('No college linked');

        const courses = await prisma.course.findMany({
            where: { collegeId: profile.collegeId },
            include: { reservations: true, rounds: { orderBy: { roundNumber: 'desc' } }, _count: { select: { applications: true, allotments: true } } }
        });
        res.json(courses);
    } catch (err) { next(err); }
});

// Update course
router.put('/courses/:id', async (req: AuthRequest, res, next) => {
    try {
        const { name, totalSeats, eligibilityPercentage, admissionMode, tuitionFee, labFee, libraryFee, otherFee,
            installmentEnabled, scholarshipEnabled, unfilledSeatRule } = req.body;
        const totalFee = (tuitionFee || 0) + (labFee || 0) + (libraryFee || 0) + (otherFee || 0);

        const course = await prisma.course.update({
            where: { id: req.params.id as string },
            data: {
                ...(name && { name }), ...(totalSeats !== undefined && { totalSeats }),
                ...(eligibilityPercentage !== undefined && { eligibilityPercentage }),
                ...(admissionMode && { admissionMode }), ...(unfilledSeatRule && { unfilledSeatRule }),
                tuitionFee: tuitionFee || 0, labFee: labFee || 0, libraryFee: libraryFee || 0, otherFee: otherFee || 0, totalFee,
                ...(installmentEnabled !== undefined && { installmentEnabled }),
                ...(scholarshipEnabled !== undefined && { scholarshipEnabled })
            }
        });

        await prisma.auditLog.create({
            data: { userId: req.user!.id, action: 'UPDATE_COURSE', entity: 'Course', entityId: course.id, details: JSON.stringify(req.body) }
        });
        res.json(course);
    } catch (err) { next(err); }
});

// Delete course
router.delete('/courses/:id', async (req: AuthRequest, res, next) => {
    try {
        const allotments = await prisma.allotment.count({ where: { courseId: req.params.id as string } });
        if (allotments > 0) throw new AppError('Cannot delete course with existing allotments');

        await prisma.application.deleteMany({ where: { courseId: req.params.id as string } });
        await prisma.reservationMatrix.deleteMany({ where: { courseId: req.params.id as string } });
        await prisma.round.deleteMany({ where: { courseId: req.params.id as string } });
        await prisma.course.delete({ where: { id: req.params.id as string } });

        await prisma.auditLog.create({
            data: { userId: req.user!.id, action: 'DELETE_COURSE', entity: 'Course', entityId: req.params.id as string }
        });
        res.json({ message: 'Course deleted' });
    } catch (err) { next(err); }
});

// Set reservation matrix
router.post('/courses/:id/reservation', async (req: AuthRequest, res, next) => {
    try {
        const { reservations } = req.body; // [{category, percentage}]
        const course = await prisma.course.findUnique({ where: { id: req.params.id as string } });
        if (!course) throw new AppError('Course not found', 404);

        // Check if round 1 has started
        const activeRound = await prisma.round.findFirst({
            where: { courseId: req.params.id as string, status: { in: ['IN_PROGRESS', 'COMPLETED'] } }
        });
        if (activeRound) throw new AppError('Cannot modify reservation after Round 1 begins');

        const totalPct = reservations.reduce((sum: number, r: any) => sum + r.percentage, 0);
        if (Math.abs(totalPct - 100) > 0.01) throw new AppError('Reservation percentages must total 100%');

        // Delete existing and recreate
        await prisma.reservationMatrix.deleteMany({ where: { courseId: req.params.id as string } });

        const created = await Promise.all(
            reservations.map((r: any) =>
                prisma.reservationMatrix.create({
                    data: {
                        courseId: req.params.id as string,
                        category: r.category,
                        percentage: r.percentage,
                        seats: Math.round((r.percentage / 100) * course.totalSeats)
                    }
                })
            )
        );

        await prisma.auditLog.create({
            data: { userId: req.user!.id, action: 'SET_RESERVATION', entity: 'Course', entityId: req.params.id as string, details: JSON.stringify(reservations) }
        });

        res.json(created);
    } catch (err) { next(err); }
});



// Get all applications for the faculty's college
router.get('/applications', async (req: AuthRequest, res, next) => {
    try {
        const profile = await prisma.facultyProfile.findUnique({ where: { userId: req.user!.id } });
        if (!profile?.collegeId) throw new AppError('No college linked');

        const applications = await prisma.application.findMany({
            where: { course: { collegeId: profile.collegeId } },
            include: {
                student: { include: { user: { select: { name: true, email: true, phone: true } } } },
                course: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(applications);
    } catch (err) { next(err); }
});

// Update application status
router.put('/applications/:appId/status', async (req: AuthRequest, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['PENDING', 'ELIGIBLE', 'INELIGIBLE', 'REJECTED'];
        if (!validStatuses.includes(status)) throw new AppError('Invalid status');

        const profile = await prisma.facultyProfile.findUnique({ where: { userId: req.user!.id } });
        if (!profile?.collegeId) throw new AppError('No college linked');

        // Verify application belongs to faculty's college
        const application = await prisma.application.findUnique({
            where: { id: req.params.appId as string },
            include: { course: true }
        });
        if (!application || application.course.collegeId !== profile.collegeId) {
            throw new AppError('Application not found or access denied', 404);
        }

        const updated = await prisma.application.update({
            where: { id: req.params.appId as string },
            data: { status }
        });

        // Create notification for student
        const student = await prisma.studentProfile.findUnique({ where: { id: application.studentId } });
        if (student) {
            await prisma.notification.create({
                data: {
                    userId: student.userId,
                    title: 'Application Status Updated',
                    message: `Your application for ${application.course.name} has been marked as ${status}.`,
                    type: status === 'REJECTED' ? 'WARNING' : 'INFO'
                }
            });
        }

        await prisma.auditLog.create({
            data: { userId: req.user!.id, action: 'UPDATE_APP_STATUS', entity: 'Application', entityId: updated.id, details: JSON.stringify({ status }) }
        });

        res.json(updated);
    } catch (err) { next(err); }
});

// Get full student application detail
router.get('/applications/:appId/detail', async (req: AuthRequest, res, next) => {
    try {
        const application = await prisma.application.findUnique({
            where: { id: req.params.appId as string },
            include: {
                student: {
                    include: { user: { select: { name: true, email: true, phone: true } } }
                },
                course: { include: { college: true } }
            }
        });
        if (!application) throw new AppError('Application not found', 404);
        res.json(application);
    } catch (err) { next(err); }
});

// Faculty analytics
router.get('/analytics', async (req: AuthRequest, res, next) => {
    try {
        const profile = await prisma.facultyProfile.findUnique({ where: { userId: req.user!.id } });
        if (!profile?.collegeId) return res.json({ categoryBreakdown: [], statusBreakdown: [], courseFillRate: [] });

        const courses = await prisma.course.findMany({
            where: { collegeId: profile.collegeId },
            select: { id: true, name: true, code: true, totalSeats: true, _count: { select: { applications: true, allotments: true } } }
        });

        const courseIds = courses.map(c => c.id);
        const applications = await prisma.application.findMany({
            where: { courseId: { in: courseIds } },
            include: { student: true }
        });

        const categoryBreakdown: Record<string, number> = {};
        const statusBreakdown: Record<string, number> = {};
        applications.forEach(a => {
            categoryBreakdown[a.student.category] = (categoryBreakdown[a.student.category] || 0) + 1;
            statusBreakdown[a.status] = (statusBreakdown[a.status] || 0) + 1;
        });

        res.json({
            categoryBreakdown: Object.entries(categoryBreakdown).map(([category, count]) => ({ category, count })),
            statusBreakdown: Object.entries(statusBreakdown).map(([status, count]) => ({ status, count })),
            courseFillRate: courses.map(c => ({
                name: c.name, code: c.code, totalSeats: c.totalSeats,
                applications: c._count.applications, allotments: c._count.allotments,
                fillRate: c.totalSeats > 0 ? Math.round((c._count.allotments / c.totalSeats) * 100) : 0
            }))
        });
    } catch (err) { next(err); }
});

export default router;
