import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authenticate);

// Mock student database for DigiLocker
const MOCK_STUDENTS: Record<string, any> = {
    '9876543210': {
        name: 'Ravi Kumar', gender: 'MALE', dob: '2002-05-15',
        fatherName: 'Suresh Kumar', motherName: 'Lakshmi Devi', parentMobile: '9800011111', parentOccupation: 'Government Employee', annualIncome: 600000,
        houseNo: '12-5-100', street: 'Gandhi Nagar', village: 'Tirupati', mandal: 'Tirupati Urban', district: 'Tirupati', pincode: '517501',
        category: 'GENERAL', minority: false, physicallyHandicapped: false, sportsQuota: false,
        ssc: {
            hallTicket: 'AP-SSC-2018-101001', board: 'AP Board of SSC', yearOfPassing: '2018', grade: 'A1',
            telugu: 95, hindi: 88, english: 92, maths: 98, science: 96, social: 90, total: 559, outOf: 600, pct: 93.17
        },
        inter: {
            hallTicket: 'AP-IPE-2020-201001', board: 'AP Board of Intermediate', group: 'MPC', yearOfPassing: '2020',
            physics: 95, chemistry: 89, maths: 98, english: 90, total: 372, outOf: 400, pct: 93.0
        }
    },
    '9876543211': {
        name: 'Priya Sharma', gender: 'FEMALE', dob: '2001-08-22',
        fatherName: 'Rajesh Sharma', motherName: 'Sunita Sharma', parentMobile: '9800022222', parentOccupation: 'Private Business', annualIncome: 450000,
        houseNo: '3-2-45', street: 'Nehru Street', village: 'Guntur', mandal: 'Guntur', district: 'Guntur', pincode: '522001',
        category: 'OBC', minority: false, physicallyHandicapped: false, sportsQuota: false,
        ssc: {
            hallTicket: 'AP-SSC-2017-101002', board: 'AP Board of SSC', yearOfPassing: '2017', grade: 'A2',
            telugu: 80, hindi: 75, english: 82, maths: 85, science: 78, social: 72, total: 472, outOf: 600, pct: 78.67
        },
        inter: {
            hallTicket: 'AP-IPE-2019-201002', board: 'AP Board of Intermediate', group: 'BiPC', yearOfPassing: '2019',
            physics: 80, chemistry: 76, maths: 82, english: 78, total: 316, outOf: 400, pct: 79.0
        }
    },
    '9876543212': {
        name: 'Arun Reddy', gender: 'MALE', dob: '2002-01-10',
        fatherName: 'Venkata Reddy', motherName: 'Padma Reddy', parentMobile: '9800033333', parentOccupation: 'Farmer', annualIncome: 200000,
        houseNo: '7-1-88', street: 'Main Road', village: 'Kurnool', mandal: 'Kurnool', district: 'Kurnool', pincode: '518001',
        category: 'SC', minority: false, physicallyHandicapped: false, sportsQuota: false,
        ssc: {
            hallTicket: 'AP-SSC-2018-101003', board: 'AP Board of SSC', yearOfPassing: '2018', grade: 'B1',
            telugu: 70, hindi: 65, english: 72, maths: 68, science: 66, social: 60, total: 401, outOf: 600, pct: 66.83
        },
        inter: {
            hallTicket: 'AP-IPE-2020-201003', board: 'AP Board of Intermediate', group: 'MPC', yearOfPassing: '2020',
            physics: 68, chemistry: 62, maths: 65, english: 64, total: 259, outOf: 400, pct: 64.75
        }
    },
    '9876543213': {
        name: 'Sita Devi', gender: 'FEMALE', dob: '2003-03-25',
        fatherName: 'Ramaiah', motherName: 'Sarojini', parentMobile: '9800044444', parentOccupation: 'Teacher', annualIncome: 500000,
        houseNo: '15-6-200', street: 'Temple Road', village: 'Vijayawada', mandal: 'Vijayawada', district: 'NTR', pincode: '520001',
        category: 'GENERAL', minority: false, physicallyHandicapped: false, sportsQuota: true,
        ssc: {
            hallTicket: 'AP-SSC-2019-101004', board: 'AP Board of SSC', yearOfPassing: '2019', grade: 'A1',
            telugu: 90, hindi: 85, english: 92, maths: 88, science: 87, social: 85, total: 527, outOf: 600, pct: 87.83
        },
        inter: {
            hallTicket: 'AP-IPE-2021-201004', board: 'AP Board of Intermediate', group: 'MPC', yearOfPassing: '2021',
            physics: 90, chemistry: 88, maths: 92, english: 85, total: 355, outOf: 400, pct: 88.75
        }
    },
    '9876543214': {
        name: 'Venkat Rao', gender: 'MALE', dob: '2000-11-08',
        fatherName: 'Srinivasa Rao', motherName: 'Vijaya Lakshmi', parentMobile: '9800055555', parentOccupation: 'Doctor', annualIncome: 1200000,
        houseNo: '22-9-300', street: 'MG Road', village: 'Visakhapatnam', mandal: 'Visakhapatnam', district: 'Visakhapatnam', pincode: '530001',
        category: 'OBC', minority: false, physicallyHandicapped: false, sportsQuota: false,
        ssc: {
            hallTicket: 'AP-SSC-2016-101005', board: 'AP Board of SSC', yearOfPassing: '2016', grade: 'A1',
            telugu: 85, hindi: 80, english: 88, maths: 82, science: 80, social: 78, total: 493, outOf: 600, pct: 82.17
        },
        inter: {
            hallTicket: 'AP-IPE-2018-201005', board: 'AP Board of Intermediate', group: 'MEC', yearOfPassing: '2018',
            physics: 82, chemistry: 80, maths: 85, english: 78, total: 325, outOf: 400, pct: 81.25
        },
        ug: { sub1: 80, sub2: 82, sub3: 78, sub4: 85, sub5: 80, sub6: 82, total: 487, outOf: 600, pct: 81.17 }
    }
};

const MOCK_PIN = '1234';

// Step 1: Initiate - enter mobile
router.post('/initiate', async (req: AuthRequest, res, next) => {
    try {
        const { mobile } = req.body;
        if (!mobile || mobile.length !== 10) throw new AppError('Valid 10-digit mobile required');

        const mockStudent = MOCK_STUDENTS[mobile];
        if (!mockStudent) throw new AppError('Mobile not found in DigiLocker (AP mock)');

        const maskedName = mockStudent.name.split(' ').map((n: string, i: number) =>
            i === 0 ? n[0] + '***' : n[0] + '***'
        ).join(' ');

        const session = await prisma.digiLockerSession.create({
            data: { userId: req.user!.id, mobile, maskedName, status: 'INITIATED' }
        });

        res.json({ sessionId: session.id, maskedName, message: 'Enter your 4-digit PIN' });
    } catch (err) { next(err); }
});

// Step 2: Verify PIN
router.post('/verify-pin', async (req: AuthRequest, res, next) => {
    try {
        const { sessionId, pin } = req.body;
        const session = await prisma.digiLockerSession.findUnique({ where: { id: sessionId } });
        if (!session) throw new AppError('Session not found');
        if (session.userId !== req.user!.id) throw new AppError('Unauthorized');

        if (session.pinAttempts >= 3) {
            await prisma.digiLockerSession.update({ where: { id: sessionId }, data: { status: 'OTP_SENT', otpSent: true } });
            return res.json({ needOTP: true, message: 'PIN attempts exhausted. OTP sent to mobile.' });
        }

        if (pin !== MOCK_PIN) {
            await prisma.digiLockerSession.update({ where: { id: sessionId }, data: { pinAttempts: session.pinAttempts + 1 } });
            const remaining = 2 - session.pinAttempts;
            if (remaining <= 0) {
                await prisma.digiLockerSession.update({ where: { id: sessionId }, data: { status: 'OTP_SENT', otpSent: true } });
                return res.json({ needOTP: true, message: 'PIN attempts exhausted. OTP sent to mobile.' });
            }
            throw new AppError(`Invalid PIN. ${remaining} attempts remaining.`);
        }

        const token = uuidv4();
        await prisma.digiLockerSession.update({
            where: { id: sessionId },
            data: { pinVerified: true, token, status: 'VERIFIED' }
        });

        // Auto-fetch marks
        const mockStudent = MOCK_STUDENTS[session.mobile];
        await updateStudentMarks(req.user!.id, mockStudent);

        res.json({ verified: true, token, message: 'DigiLocker verified! Documents fetched.' });
    } catch (err) { next(err); }
});

// Step 3: Verify OTP (fallback)
router.post('/verify-otp', async (req: AuthRequest, res, next) => {
    try {
        const { sessionId, otp } = req.body;
        const session = await prisma.digiLockerSession.findUnique({ where: { id: sessionId } });
        if (!session) throw new AppError('Session not found');

        // Mock OTP is always 123456
        if (otp !== '123456') throw new AppError('Invalid OTP');

        const token = uuidv4();
        await prisma.digiLockerSession.update({
            where: { id: sessionId },
            data: { otpVerified: true, token, status: 'VERIFIED' }
        });

        const mockStudent = MOCK_STUDENTS[session.mobile];
        await updateStudentMarks(req.user!.id, mockStudent);

        res.json({ verified: true, token, message: 'DigiLocker verified via OTP! Documents fetched.' });
    } catch (err) { next(err); }
});

async function updateStudentMarks(userId: string, mockData: any) {
    const updateData: any = {
        digilockerVerified: true,
        onboardingStep: 'DIGILOCKER_DONE'
    };

    // Identity
    if (mockData.gender) updateData.gender = mockData.gender;
    if (mockData.dob) updateData.dateOfBirth = mockData.dob;
    if (mockData.category) updateData.category = mockData.category;

    // Address
    if (mockData.houseNo) updateData.houseNo = mockData.houseNo;
    if (mockData.street) updateData.street = mockData.street;
    if (mockData.village) updateData.village = mockData.village;
    if (mockData.mandal) updateData.mandal = mockData.mandal;
    if (mockData.district) updateData.district = mockData.district;
    if (mockData.pincode) updateData.pincode = mockData.pincode;
    updateData.address = [mockData.houseNo, mockData.street, mockData.village, mockData.mandal, mockData.district, 'Andhra Pradesh', mockData.pincode].filter(Boolean).join(', ');

    // Parent / Guardian
    if (mockData.fatherName) updateData.fatherName = mockData.fatherName;
    if (mockData.motherName) updateData.motherName = mockData.motherName;
    if (mockData.guardianName) updateData.guardianName = mockData.guardianName;
    if (mockData.parentMobile) updateData.parentMobile = mockData.parentMobile;
    if (mockData.parentOccupation) updateData.parentOccupation = mockData.parentOccupation;
    if (mockData.annualIncome !== undefined) updateData.annualIncome = mockData.annualIncome;

    // Category Extensions
    if (mockData.minority !== undefined) updateData.minority = mockData.minority;
    if (mockData.physicallyHandicapped !== undefined) updateData.physicallyHandicapped = mockData.physicallyHandicapped;
    if (mockData.sportsQuota !== undefined) updateData.sportsQuota = mockData.sportsQuota;

    // SSC Academic
    if (mockData.ssc) {
        updateData.sscHallTicket = mockData.ssc.hallTicket;
        updateData.sscBoard = mockData.ssc.board;
        updateData.sscYearOfPassing = mockData.ssc.yearOfPassing;
        updateData.sscGrade = mockData.ssc.grade;
        updateData.sscMarks = mockData.ssc.total;
        updateData.sscTotal = mockData.ssc.outOf;
        updateData.sscPercentage = mockData.ssc.pct;
        updateData.sscDocStatus = 'AUTO_FETCHED';
    }

    // Inter Academic
    if (mockData.inter) {
        updateData.interHallTicket = mockData.inter.hallTicket;
        updateData.interBoard = mockData.inter.board;
        updateData.interGroup = mockData.inter.group;
        updateData.interYearOfPassing = mockData.inter.yearOfPassing;
        updateData.interMarks = mockData.inter.total;
        updateData.interTotal = mockData.inter.outOf;
        updateData.interPercentage = mockData.inter.pct;
        updateData.interDocStatus = 'AUTO_FETCHED';
    }

    // UG Academic (for PG admissions)
    if (mockData.ug) {
        updateData.ugMarks = mockData.ug.total;
        updateData.ugTotal = mockData.ug.outOf;
        updateData.ugPercentage = mockData.ug.pct;
        updateData.ugDocStatus = 'AUTO_FETCHED';
    }

    await prisma.studentProfile.update({ where: { userId }, data: updateData });
}

// Get session status
router.get('/status', async (req: AuthRequest, res, next) => {
    try {
        const session = await prisma.digiLockerSession.findFirst({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(session);
    } catch (err) { next(err); }
});

export default router;
