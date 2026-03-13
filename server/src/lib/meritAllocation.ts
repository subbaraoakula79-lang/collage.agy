import prisma from './prisma';

// Merit allocation algorithm — shared between admin and faculty routes
export async function runMeritAllocation(course: any, round: any) {
    const reservations = await prisma.reservationMatrix.findMany({ where: { courseId: course.id } });

    // Get eligible applications (not already frozen/accepted in another course)
    const applications = await prisma.application.findMany({
        where: { courseId: course.id, status: { in: ['ELIGIBLE', 'WAITLISTED'] } },
        include: { student: true },
        orderBy: { appliedMarks: 'desc' }
    });

    // Track already allotted globally across all courses
    const allotted: string[] = [];
    const allotments: any[] = [];

    // Find ALL globally active allotments across the entire system
    const globallyActiveAllotments = await prisma.allotment.findMany({
        where: {
            status: { in: ['ALLOTTED', 'ACCEPTED', 'FROZEN'] },
        }
    });

    globallyActiveAllotments.forEach((a: any) => {
        if (!allotted.includes(a.studentId)) {
            allotted.push(a.studentId);
        }
    });

    // Check for frozen students in this specific course (they keep their seats)
    const frozenAllotments = await prisma.allotment.findMany({
        where: { courseId: course.id, status: 'FROZEN' }
    });
    // frozenAllotments are already in the globallyActiveAllotments array, so their studentId is in `allotted`.

    // Step 1: Fill General seats
    const generalRes = reservations.find((r: any) => r.category === 'GENERAL');
    if (generalRes) {
        const existingGeneral = frozenAllotments.filter((a: any) => a.category === 'GENERAL').length;
        let remaining = generalRes.seats - existingGeneral;
        for (const app of applications) {
            if (remaining <= 0) break;
            if (allotted.includes(app.studentId)) continue;
            allotments.push({ studentId: app.studentId, courseId: course.id, roundId: round.id, category: 'GENERAL' });
            allotted.push(app.studentId);
            remaining--;
        }
    }

    // Step 2-5: Fill reserved category seats
    const categories = ['OBC', 'SC', 'ST', 'EWS'];
    for (const cat of categories) {
        const catRes = reservations.find((r: any) => r.category === cat);
        if (!catRes) continue;
        const existingCat = frozenAllotments.filter((a: any) => a.category === cat).length;
        let remaining = catRes.seats - existingCat;
        const catApps = applications.filter((a: any) => a.student.category === cat && !allotted.includes(a.studentId));
        for (const app of catApps) {
            if (remaining <= 0) break;
            allotments.push({ studentId: app.studentId, courseId: course.id, roundId: round.id, category: cat });
            allotted.push(app.studentId);
            remaining--;
        }

        // Handle unfilled seats
        if (remaining > 0 && course.unfilledSeatRule === 'CONVERT_TO_GENERAL') {
            const generalApps = applications.filter((a: any) => !allotted.includes(a.studentId));
            for (const app of generalApps) {
                if (remaining <= 0) break;
                allotments.push({ studentId: app.studentId, courseId: course.id, roundId: round.id, category: 'GENERAL' });
                allotted.push(app.studentId);
                remaining--;
            }
        }
    }

    // Create allotments in DB
    for (const a of allotments) {
        await prisma.allotment.create({ data: { ...a, status: 'ALLOTTED' } });
        await prisma.application.updateMany({
            where: { studentId: a.studentId, courseId: a.courseId },
            data: { status: 'ALLOTTED' }
        });
    }

    return allotments;
}
