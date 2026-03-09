import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);
router.use(authorize('STUDENT'));

// Get student profile
router.get('/profile', async (req: AuthRequest, res, next) => {
    try {
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user!.id },
            include: { user: { select: { name: true, email: true, phone: true } } }
        });
        if (!profile) throw new AppError('Profile not found', 404);
        res.json(profile);
    } catch (err) { next(err); }
});

// Get onboarding status
router.get('/onboarding-status', async (req: AuthRequest, res, next) => {
    try {
        let profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user!.id },
            include: { user: { select: { name: true, email: true, phone: true } } }
        });
        if (!profile) throw new AppError('Profile not found', 404);

        // Auto-fix: If they already have applications, they should be marked as COMPLETE
        if (profile.onboardingStep !== 'COMPLETE') {
            const appCount = await prisma.application.count({ where: { studentId: profile.id } });
            if (appCount > 0) {
                profile = await prisma.studentProfile.update({
                    where: { id: profile.id },
                    data: { onboardingStep: 'COMPLETE' },
                    include: { user: { select: { name: true, email: true, phone: true } } }
                });
            }
        }
        res.json(profile);
    } catch (err) { next(err); }
});


// Set admission type (onboarding step 1)
router.post('/set-admission-type', async (req: AuthRequest, res, next) => {
    try {
        const { admissionType } = req.body;
        const validTypes = ['UG', 'PG'];
        if (!validTypes.includes(admissionType)) throw new AppError('Invalid admission type');

        const profile = await prisma.studentProfile.update({
            where: { userId: req.user!.id },
            data: { admissionType, onboardingStep: 'TYPE_SELECTED' }
        });
        res.json({ message: 'Admission type set', admissionType, onboardingStep: profile.onboardingStep });
    } catch (err) { next(err); }
});

// Submit documents (onboarding step 3)
router.post('/submit-documents', async (req: AuthRequest, res, next) => {
    try {
        const { manualDocs } = req.body;
        // manualDocs: { ssc?: true, inter?: true, ug?: true, caste?: true, income?: true }
        const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
        if (!profile) throw new AppError('Profile not found');

        const updateData: any = { onboardingStep: 'DOCS_SUBMITTED' };

        // For each doc, if already AUTO_FETCHED keep it, else check manual submission
        if (profile.sscDocStatus === 'NOT_SUBMITTED' && manualDocs?.ssc) updateData.sscDocStatus = 'MANUAL';
        if (profile.interDocStatus === 'NOT_SUBMITTED' && manualDocs?.inter) updateData.interDocStatus = 'MANUAL';
        if (profile.ugDocStatus === 'NOT_SUBMITTED' && manualDocs?.ug) updateData.ugDocStatus = 'MANUAL';
        if (profile.casteDocStatus === 'NOT_SUBMITTED' && manualDocs?.caste) updateData.casteDocStatus = 'MANUAL';
        if (profile.incomeDocStatus === 'NOT_SUBMITTED' && manualDocs?.income) updateData.incomeDocStatus = 'MANUAL';

        const updated = await prisma.studentProfile.update({
            where: { userId: req.user!.id },
            data: updateData
        });
        res.json({ message: 'Documents submitted', onboardingStep: updated.onboardingStep });
    } catch (err) { next(err); }
});

// Update student profile
router.put('/profile', async (req: AuthRequest, res, next) => {
    try {
        const { category, dateOfBirth, address, state } = req.body;
        const profile = await prisma.studentProfile.update({
            where: { userId: req.user!.id },
            data: { ...(category && { category }), ...(dateOfBirth && { dateOfBirth }), ...(address && { address }), ...(state && { state }) }
        });
        res.json(profile);
    } catch (err) { next(err); }
});

// Get available courses
router.get('/courses', async (req: AuthRequest, res, next) => {
    try {
        const { admissionType } = req.query;
        const where: any = { isActive: true };
        if (admissionType) where.admissionType = admissionType;

        const courses = await prisma.course.findMany({
            where,
            include: { college: true, reservations: true, _count: { select: { applications: true } } }
        });
        res.json(courses);
    } catch (err) { next(err); }
});

// Apply to courses (batch — up to 3 with preferences)
router.post('/apply', async (req: AuthRequest, res, next) => {
    try {
        const { courseIds, admissionType } = req.body;
        // courseIds: string[] — ordered by preference (index 0 = preference 1)
        if (!courseIds || !Array.isArray(courseIds) || courseIds.length < 3 || courseIds.length > 5) {
            throw new AppError('Select 3 to 5 courses');
        }

        const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
        if (!profile) throw new AppError('Complete your profile first');
        if (!profile.digilockerVerified) throw new AppError('DigiLocker verification required before applying');

        // Determine student percentage
        let studentPct = 0;
        if (admissionType === 'UG') studentPct = profile.interPercentage || 0;
        else if (admissionType === 'PG') studentPct = profile.ugPercentage || 0;

        // Check existing applications count for this admission type
        const existingCount = await prisma.application.count({
            where: { studentId: profile.id, admissionType }
        });
        if (existingCount > 0) throw new AppError('You have already applied for this admission type');

        // Validate all courses and check eligibility
        const courses = await prisma.course.findMany({ where: { id: { in: courseIds } } });
        if (courses.length !== courseIds.length) throw new AppError('One or more courses not found');

        for (const course of courses) {
            if (course.admissionType !== admissionType) throw new AppError(`Course ${course.name} is not for ${admissionType}`);
            if (course.admissionType === 'DIPLOMA') throw new AppError('Diploma admissions coming soon');
            if (course.admissionType === 'ENGINEERING') throw new AppError('Engineering admissions coming soon');
            if (studentPct < course.eligibilityPercentage) {
                throw new AppError(`Not eligible for ${course.name}. Requires ${course.eligibilityPercentage}%, your score: ${studentPct}%`);
            }
        }

        // Create all applications
        const applications = [];
        for (let i = 0; i < courseIds.length; i++) {
            const app = await prisma.application.create({
                data: {
                    studentId: profile.id,
                    courseId: courseIds[i],
                    admissionType,
                    appliedMarks: studentPct,
                    status: 'ELIGIBLE',
                    preference: i + 1
                }
            });
            applications.push(app);
        }

        // Update onboarding step
        await prisma.studentProfile.update({
            where: { userId: req.user!.id },
            data: { onboardingStep: 'COMPLETE' }
        });

        res.status(201).json({ message: `Applied to ${courseIds.length} courses`, applications });
    } catch (err) { next(err); }
});

// Get my applications
router.get('/applications', async (req: AuthRequest, res, next) => {
    try {
        const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
        if (!profile) throw new AppError('Profile not found');

        const applications = await prisma.application.findMany({
            where: { studentId: profile.id },
            include: { course: { include: { college: true } } },
            orderBy: { preference: 'asc' }
        });
        res.json(applications);
    } catch (err) { next(err); }
});

// Get allotments
router.get('/allotments', async (req: AuthRequest, res, next) => {
    try {
        const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
        if (!profile) throw new AppError('Profile not found');

        const allotments = await prisma.allotment.findMany({
            where: {
                studentId: profile.id,
                round: { isPublished: true }
            },
            include: { course: { include: { college: true } }, round: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(allotments);
    } catch (err) { next(err); }
});

// Accept / Freeze / Reject allotment
router.post('/allotment/:id/respond', async (req: AuthRequest, res, next) => {
    try {
        const { action } = req.body;
        const allotment = await prisma.allotment.findUnique({ where: { id: req.params.id as string } });
        if (!allotment) throw new AppError('Allotment not found', 404);

        const validActions = ['ACCEPTED', 'FROZEN', 'CANCELLED'];
        if (!validActions.includes(action)) throw new AppError('Invalid action');

        const updated = await prisma.allotment.update({
            where: { id: req.params.id as string },
            data: { status: action }
        });

        await prisma.application.updateMany({
            where: { studentId: allotment.studentId, courseId: allotment.courseId },
            data: { status: action }
        });

        res.json(updated);
    } catch (err) { next(err); }
});

// Get payments
router.get('/payments', async (req: AuthRequest, res, next) => {
    try {
        const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
        if (!profile) throw new AppError('Profile not found');

        const payments = await prisma.payment.findMany({
            where: { studentId: profile.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(payments);
    } catch (err) { next(err); }
});

export default router;
