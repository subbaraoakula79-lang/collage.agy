
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const userCount = await prisma.user.count();
        const users = await prisma.user.findMany({ select: { email: true, role: true, isVerified: true }, take: 10 });

        console.log("--- DB DIAGNOSTIC ---");
        console.log("User count:", userCount);
        console.log("Sample users:", users);
        console.log("---------------------");
    } catch (e) {
        console.error("Diagnostic failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
