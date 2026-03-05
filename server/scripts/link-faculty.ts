import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const collegeCode = args[0] || 'TEST-01';
    const email = args[1] || 'fac1@test.com';

    let college = await prisma.college.findUnique({ where: { code: collegeCode } });
    if (!college) {
        console.error(`College with code ${collegeCode} not found! Admin subagent probably failed to create it.`);
        process.exit(1);
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        const hashed = await bcrypt.hash('password123', 10);
        user = await prisma.user.create({
            data: { name: 'Test Faculty', email, password: hashed, role: 'FACULTY', isVerified: true }
        });
        await prisma.facultyProfile.create({ data: { userId: user.id, collegeId: college.id } });
        console.log(`Created Faculty ${email} and linked to ${college.name}`);
    } else {
        await prisma.facultyProfile.upsert({
            where: { userId: user.id },
            update: { collegeId: college.id },
            create: { userId: user.id, collegeId: college.id }
        });
        console.log(`Linked existing Faculty ${email} to ${college.name}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
