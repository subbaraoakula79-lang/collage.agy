import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import crypto from 'crypto';

const router = Router();

// Register
router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password, role, phone } = req.body;
        if (!name || !email || !password) {
            throw new AppError('Name, email, and password are required');
        }
        const validRoles = ['STUDENT', 'FACULTY', 'ADMIN'];
        const userRole = validRoles.includes(role) ? role : 'STUDENT';

        const lowerEmail = email.toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });
        if (existing) throw new AppError('Email already registered');

        const hashed = await bcrypt.hash(password, 12);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const user = await prisma.user.create({
            data: { name, email: lowerEmail, password: hashed, role: userRole, phone, otp, otpExpiresAt }
        });

        if (userRole === 'STUDENT') {
            await prisma.studentProfile.create({ data: { userId: user.id } });
        } else if (userRole === 'FACULTY') {
            await prisma.facultyProfile.create({ data: { userId: user.id } });
        }

        console.log(`📧 OTP for ${email}: ${otp}`);
        res.status(201).json({ message: 'Registration successful. OTP sent to email.', userId: user.id, otp: process.env.ENV_MODE === 'MOCK_AP' ? otp : undefined });
    } catch (err) { next(err); }
});

// Verify OTP
router.post('/verify-otp', async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const lowerEmail = email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: lowerEmail } });
        if (!user) throw new AppError('User not found');
        if (user.otp !== otp) throw new AppError('Invalid OTP');
        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) throw new AppError('OTP expired');

        await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, otp: null, otpExpiresAt: null }
        });

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            if (process.env.ENV_MODE === 'PRODUCTION') throw new AppError('JWT_SECRET is not configured', 500);
            console.warn('⚠️ JWT_SECRET is not configured, using insecure fallback for development');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            jwtSecret || 'insecure-dev-secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        res.json({ message: 'Email verified', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: true } });
    } catch (err) { next(err); }
});

// Login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) throw new AppError('Email and password required');

        const lowerEmail = email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: lowerEmail } });
        if (!user) throw new AppError('Invalid credentials', 401);

        if (!user.isVerified) {
            throw new AppError('Please verify your email before logging in.', 403);
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new AppError('Wrong password', 401);

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            if (process.env.ENV_MODE === 'PRODUCTION') throw new AppError('JWT_SECRET is not configured', 500);
            console.warn('⚠️ JWT_SECRET is not configured, using insecure fallback for development');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            jwtSecret || 'insecure-dev-secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });
    } catch (err) { next(err); }
});

// Forgot Password
router.post('/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) throw new AppError('Email is required');

        const lowerEmail = email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: lowerEmail } });

        // Always return success to avoid email enumeration
        if (!user) {
            return res.json({ message: 'If an account exists, a reset code has been sent.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await prisma.user.update({
            where: { id: user.id },
            data: { otp, otpExpiresAt }
        });

        console.log(`🔑 Reset OTP for ${lowerEmail}: ${otp}`);
        res.json({
            message: 'If an account exists, a reset code has been sent.',
            otp: process.env.ENV_MODE === 'MOCK_AP' ? otp : undefined
        });
    } catch (err) { next(err); }
});

// Reset Password
router.post('/reset-password', async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            throw new AppError('Email, OTP, and new password are required');
        }

        const lowerEmail = email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: lowerEmail } });

        if (!user || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            throw new AppError('Invalid or expired reset code');
        }

        const hashed = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashed,
                otp: null,
                otpExpiresAt: null,
                isVerified: true // Automatically verify if they reset via email
            }
        });

        res.json({ message: 'Password reset successful. You can now log in.' });
    } catch (err) { next(err); }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { id: true, name: true, email: true, role: true, phone: true, isVerified: true, createdAt: true }
        });
        if (!user) throw new AppError('User not found', 404);

        let profile = null;
        if (user.role === 'STUDENT') {
            profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
        } else if (user.role === 'FACULTY') {
            profile = await prisma.facultyProfile.findUnique({
                where: { userId: user.id },
                include: { college: true }
            });
        }

        res.json({ user, profile });
    } catch (err) { next(err); }
});

// Update Aadhaar
router.post('/aadhaar', authenticate, async (req: AuthRequest, res, next) => {
    try {
        if (req.user!.role !== 'STUDENT') throw new AppError('Only students can update Aadhaar');
        const { aadhaar } = req.body;
        if (!aadhaar || aadhaar.length !== 12) throw new AppError('Valid 12-digit Aadhaar required');

        const encryptionKey = process.env.AADHAAR_ENCRYPTION_KEY;
        if (!encryptionKey) {
            if (process.env.ENV_MODE === 'PRODUCTION') throw new AppError('AADHAAR_ENCRYPTION_KEY is not configured', 500);
            console.warn('⚠️ AADHAAR_ENCRYPTION_KEY is not configured, using insecure fallback');
        }
        const key = encryptionKey || 'default-key-32-chars-long!!!!!';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32).slice(0, 32)), iv);
        let encrypted = cipher.update(aadhaar, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const aadhaarEncrypted = iv.toString('hex') + ':' + encrypted;
        const aadhaarHash = crypto.createHash('sha256').update(aadhaar).digest('hex');

        // Check uniqueness
        const existingProfile = await prisma.studentProfile.findFirst({ where: { aadhaarHash } });
        if (existingProfile && existingProfile.userId !== req.user!.id) {
            throw new AppError('This Aadhaar is already linked to another account');
        }

        await prisma.studentProfile.update({
            where: { userId: req.user!.id },
            data: { aadhaarEncrypted, aadhaarHash }
        });

        res.json({ message: 'Aadhaar updated successfully' });
    } catch (err) { next(err); }
});

export default router;
