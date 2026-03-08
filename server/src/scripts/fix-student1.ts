import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'student1@nap.gov.in';
    const password = 'Test@123';
    const hashed = await bcrypt.hash(password, 12);

    console.log(`🔧 Fixing user: ${email}`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashed,
            isVerified: true,
            role: 'STUDENT'
        },
        create: {
            name: 'Student 1',
            email,
            password: hashed,
            role: 'STUDENT',
            isVerified: true
        }
    });

    console.log(`✅ User updated/created: ${user.id}`);

    const profile = await prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: {
            onboardingStep: 'REGISTERED' // Reset to first step if stuck
        },
        create: {
            userId: user.id,
            onboardingStep: 'REGISTERED'
        }
    });

    console.log(`✅ Student profile updated/created: ${profile.id}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
