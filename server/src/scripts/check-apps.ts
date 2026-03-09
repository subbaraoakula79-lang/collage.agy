import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkApps() {
    const student = await prisma.user.findUnique({ where: { email: 'student1@nap.gov.in' } });
    if (!student) {
        console.log("❌ Student not found");
        return;
    }

    const profile = await prisma.studentProfile.findUnique({ where: { userId: student.id } });
    if (!profile) {
        console.log("❌ Profile not found");
        return;
    }

    console.log(`Student ID: ${profile.id}`);
    console.log(`Onboarding Step: ${profile.onboardingStep}`);

    const apps = await prisma.application.findMany({ where: { studentId: profile.id } });
    console.log(`Applications found: ${apps.length}`);
    apps.forEach(app => console.log(`- App ID: ${app.id}, Status: ${app.status}, Admission Type: ${app.admissionType}`));
}

checkApps()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
