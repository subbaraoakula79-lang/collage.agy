import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const pwd = await bcrypt.hash('Test@123', 12);
    const user = await prisma.user.create({
        data: {
            name: 'New Faculty',
            email: 'newfaculty@nap.gov.in',
            password: pwd,
            role: 'FACULTY',
            isVerified: true
        }
    });
    await prisma.facultyProfile.create({
        data: {
            userId: user.id,
            department: 'Testing',
            designation: 'Lecturer'
        }
    });
    console.log('Unlinked faculty created: newfaculty@nap.gov.in');
}

main().catch(console.error).finally(() => prisma.$disconnect());
