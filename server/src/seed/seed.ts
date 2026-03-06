import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with fresh data...');

    // Clear existing data
    await prisma.chatHistory.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.refund.deleteMany();
    await prisma.allotment.deleteMany();
    await prisma.application.deleteMany();
    await prisma.round.deleteMany();
    await prisma.reservationMatrix.deleteMany();
    await prisma.digiLockerSession.deleteMany();
    await prisma.course.deleteMany();
    await prisma.facultyProfile.deleteMany();
    await prisma.studentProfile.deleteMany();
    await prisma.college.deleteMany();
    await prisma.user.deleteMany();

    const pwd = await bcrypt.hash('Test@123', 12);

    // Create Admin
    const admin = await prisma.user.create({
        data: { name: 'Admin User', email: 'admin@nap.gov.in', password: pwd, role: 'ADMIN', isVerified: true }
    });
    console.log('✅ Admin created:', admin.email);

    // Create Colleges
    const college1 = await prisma.college.create({
        data: { name: 'Sri Venkateswara University', code: 'SVU', address: 'Tirupati, AP', city: 'Tirupati', state: 'Andhra Pradesh' }
    });
    const college2 = await prisma.college.create({
        data: { name: 'Andhra University', code: 'AU', address: 'Visakhapatnam, AP', city: 'Visakhapatnam', state: 'Andhra Pradesh' }
    });
    const college3 = await prisma.college.create({
        data: { name: 'JNTU Kakinada', code: 'JNTUK', address: 'Kakinada, AP', city: 'Kakinada', state: 'Andhra Pradesh' }
    });
    const college4 = await prisma.college.create({
        data: { name: 'JNTU Anantapur', code: 'JNTUA', address: 'Anantapur, AP', city: 'Anantapur', state: 'Andhra Pradesh' }
    });

    // Create Faculty
    const faculty1 = await prisma.user.create({
        data: { name: 'Dr. Ramesh Kumar', email: 'faculty1@nap.gov.in', password: pwd, role: 'FACULTY', isVerified: true }
    });
    await prisma.facultyProfile.create({ data: { userId: faculty1.id, collegeId: college1.id, department: 'Science & Commerce', designation: 'Professor' } });

    const faculty2 = await prisma.user.create({
        data: { name: 'Dr. Lakshmi Devi', email: 'faculty2@nap.gov.in', password: pwd, role: 'FACULTY', isVerified: true }
    });
    await prisma.facultyProfile.create({ data: { userId: faculty2.id, collegeId: college3.id, department: 'Engineering', designation: 'HOD' } });
    console.log('✅ College Admin users created');

    // Create Courses
    const bscCS = await prisma.course.create({
        data: {
            name: 'B.Sc Computer Science', code: 'BSC-CS', collegeId: college1.id,
            admissionType: 'UG', admissionMode: 'MERIT', totalSeats: 100,
            eligibilityPercentage: 60, tuitionFee: 25000, labFee: 5000, libraryFee: 2000, otherFee: 3000, totalFee: 35000,
            installmentEnabled: true, scholarshipEnabled: true
        }
    });

    const bcom = await prisma.course.create({
        data: {
            name: 'B.Com General', code: 'BCOM-GEN', collegeId: college2.id,
            admissionType: 'UG', admissionMode: 'MERIT', totalSeats: 80,
            eligibilityPercentage: 50, tuitionFee: 20000, labFee: 2000, libraryFee: 2000, otherFee: 1000, totalFee: 25000,
            installmentEnabled: false, scholarshipEnabled: true
        }
    });

    const bba = await prisma.course.create({
        data: {
            name: 'BBA - Business Administration', code: 'BBA-GEN', collegeId: college4.id,
            admissionType: 'UG', admissionMode: 'MERIT', totalSeats: 60,
            eligibilityPercentage: 55, tuitionFee: 40000, labFee: 0, libraryFee: 3000, otherFee: 2000, totalFee: 45000,
            installmentEnabled: true, scholarshipEnabled: true
        }
    });

    const mscCS = await prisma.course.create({
        data: {
            name: 'M.Sc Computer Science', code: 'MSC-CS', collegeId: college1.id,
            admissionType: 'PG', admissionMode: 'MERIT', totalSeats: 30,
            eligibilityPercentage: 55, tuitionFee: 30000, labFee: 8000, libraryFee: 2000, otherFee: 5000, totalFee: 45000,
            installmentEnabled: false, scholarshipEnabled: true
        }
    });

    const mba = await prisma.course.create({
        data: {
            name: 'Master of Business Administration', code: 'MBA', collegeId: college4.id,
            admissionType: 'PG', admissionMode: 'MERIT', totalSeats: 60,
            eligibilityPercentage: 60, tuitionFee: 70000, labFee: 5000, libraryFee: 5000, otherFee: 10000, totalFee: 90000,
            installmentEnabled: true, scholarshipEnabled: false
        }
    });

    const btechECE = await prisma.course.create({
        data: {
            name: 'B.Tech Electronics', code: 'BTECH-ECE', collegeId: college2.id,
            admissionType: 'ENGINEERING', admissionMode: 'MERIT', totalSeats: 60,
            eligibilityPercentage: 70, tuitionFee: 50000, labFee: 10000, libraryFee: 3000, otherFee: 5000, totalFee: 68000,
            installmentEnabled: true, scholarshipEnabled: false
        }
    });

    const btechCSE = await prisma.course.create({
        data: {
            name: 'B.Tech Computer Science', code: 'BTECH-CSE', collegeId: college3.id,
            admissionType: 'ENGINEERING', admissionMode: 'MERIT', totalSeats: 120,
            eligibilityPercentage: 75, tuitionFee: 60000, labFee: 15000, libraryFee: 5000, otherFee: 5000, totalFee: 85000,
            installmentEnabled: true, scholarshipEnabled: true
        }
    });

    // Set reservation matrix for each course
    const courses = [bscCS, bcom, bba, mscCS, mba, btechECE, btechCSE];
    const reservations = [
        { category: 'GENERAL', percentage: 40 },
        { category: 'OBC', percentage: 27 },
        { category: 'SC', percentage: 15 },
        { category: 'ST', percentage: 8 },
        { category: 'EWS', percentage: 10 }
    ];

    for (const course of courses) {
        for (const res of reservations) {
            await prisma.reservationMatrix.create({
                data: {
                    courseId: course.id, category: res.category, percentage: res.percentage,
                    seats: Math.round((res.percentage / 100) * course.totalSeats)
                }
            });
        }
    }
    console.log('✅ Courses and reservations created');

    // Create Fresh Mock Students
    const students = [
        {
            name: 'Rahul Varma', email: 'student1@nap.gov.in', phone: '9876543210', gender: 'MALE', dob: '2004-05-15',
            category: 'GENERAL', minority: false, ph: false, sports: false,
            fatherName: 'Suresh Varma', motherName: 'Lakshmi', parentMobile: '9800011111', parentOccupation: 'Business', annualIncome: 600000,
            houseNo: '12-5-100', street: 'Gandhi Nagar', village: 'Tirupati', mandal: 'Tirupati Urban', district: 'Tirupati', pincode: '517501',
            ssc: { ht: 'AP-SSC-2020-101001', board: 'AP Board of SSC', yop: '2020', grade: 'A1', m: 559, t: 600, p: 93.17 },
            inter: { ht: 'AP-IPE-2022-201001', board: 'AP Board of Intermediate', group: 'MPC', yop: '2022', m: 372, t: 400, p: 93.0 },
            ug: null
        },
        {
            name: 'Anjali Desai', email: 'student2@nap.gov.in', phone: '9876543211', gender: 'FEMALE', dob: '2003-08-22',
            category: 'OBC', minority: false, ph: false, sports: true,
            fatherName: 'Rajesh Desai', motherName: 'Sunita', parentMobile: '9800022222', parentOccupation: 'Teacher', annualIncome: 450000,
            houseNo: '3-2-45', street: 'Nehru Street', village: 'Guntur', mandal: 'Guntur', district: 'Guntur', pincode: '522001',
            ssc: { ht: 'AP-SSC-2019-101002', board: 'AP Board of SSC', yop: '2019', grade: 'A2', m: 472, t: 600, p: 78.67 },
            inter: { ht: 'AP-IPE-2021-201002', board: 'AP Board of Intermediate', group: 'MEC', yop: '2021', m: 316, t: 400, p: 79.0 },
            ug: null
        },
        {
            name: 'Kiran Reddy', email: 'student3@nap.gov.in', phone: '9876543212', gender: 'MALE', dob: '2001-01-10',
            category: 'SC', minority: false, ph: false, sports: false,
            fatherName: 'Venkata Reddy', motherName: 'Padma', parentMobile: '9800033333', parentOccupation: 'Govt Employee', annualIncome: 800000,
            houseNo: '7-1-88', street: 'Main Road', village: 'Kurnool', mandal: 'Kurnool', district: 'Kurnool', pincode: '518001',
            ssc: { ht: 'AP-SSC-2016-101003', board: 'AP Board of SSC', yop: '2016', grade: 'A1', m: 501, t: 600, p: 83.5 },
            inter: { ht: 'AP-IPE-2018-201003', board: 'AP Board of Intermediate', group: 'MPC', yop: '2018', m: 350, t: 400, p: 87.5 },
            ug: { m: 480, t: 600, p: 80.0 }
        },
        {
            name: 'Sneha Rao', email: 'student4@nap.gov.in', phone: '9876543213', gender: 'FEMALE', dob: '2001-11-25',
            category: 'GENERAL', minority: false, ph: true, sports: false,
            fatherName: 'Ramaiah Rao', motherName: 'Sarojini', parentMobile: '9800044444', parentOccupation: 'Farmer', annualIncome: 200000,
            houseNo: '15-6-200', street: 'Temple Road', village: 'Vijayawada', mandal: 'Vijayawada', district: 'NTR', pincode: '520001',
            ssc: { ht: 'AP-SSC-2017-101004', board: 'AP Board of SSC', yop: '2017', grade: 'A1', m: 540, t: 600, p: 90.0 },
            inter: { ht: 'AP-IPE-2019-201004', board: 'AP Board of Intermediate', group: 'CEC', yop: '2019', m: 360, t: 400, p: 90.0 },
            ug: { m: 510, t: 600, p: 85.0 }
        }
    ];

    for (const s of students) {
        const user = await prisma.user.create({
            data: { name: s.name, email: s.email, password: pwd, role: 'STUDENT', phone: s.phone, isVerified: true }
        });
        await prisma.studentProfile.create({
            data: {
                userId: user.id, category: s.category, state: 'Andhra Pradesh', digilockerVerified: true,
                gender: s.gender, dateOfBirth: s.dob,
                // Address
                houseNo: s.houseNo, street: s.street, village: s.village, mandal: s.mandal, district: s.district, pincode: s.pincode,
                address: [s.houseNo, s.street, s.village, s.mandal, s.district, 'Andhra Pradesh', s.pincode].join(', '),
                // Parent / Guardian
                fatherName: s.fatherName, motherName: s.motherName, parentMobile: s.parentMobile,
                parentOccupation: s.parentOccupation, annualIncome: s.annualIncome,
                // Category Extensions
                minority: s.minority, physicallyHandicapped: s.ph, sportsQuota: s.sports,
                // SSC Academic
                sscHallTicket: s.ssc.ht, sscBoard: s.ssc.board, sscYearOfPassing: s.ssc.yop, sscGrade: s.ssc.grade,
                sscMarks: s.ssc.m, sscTotal: s.ssc.t, sscPercentage: s.ssc.p, sscDocStatus: 'AUTO_FETCHED',
                // Inter Academic
                interHallTicket: s.inter.ht, interBoard: s.inter.board, interGroup: s.inter.group, interYearOfPassing: s.inter.yop,
                interMarks: s.inter.m, interTotal: s.inter.t, interPercentage: s.inter.p, interDocStatus: 'AUTO_FETCHED',
                // UG Academic
                ...(s.ug && { ugMarks: s.ug.m, ugTotal: s.ug.t, ugPercentage: s.ug.p, ugDocStatus: 'AUTO_FETCHED' })
            }
        });
    }
    console.log('✅ Fresh mock students created');

    console.log('\n📋 Login Credentials (all passwords: Test@123):');
    console.log('   Admin:         admin@nap.gov.in');
    console.log('   College Admin1: faculty1@nap.gov.in (SVU, Science & Commerce Dept)');
    console.log('   College Admin2: faculty2@nap.gov.in (JNTUK, Engineering Dept)');
    console.log('   Student1 (UG): student1@nap.gov.in  (Inter 93%)');
    console.log('   Student2 (UG): student2@nap.gov.in (Inter 79%)');
    console.log('   Student3 (PG): student3@nap.gov.in  (UG 80%)');
    console.log('   Student4 (PG): student4@nap.gov.in  (UG 85%)');
    console.log('\n🔐 DigiLocker: PIN=1234, OTP=123456, Mobiles: 9876543210-9876543213');
    console.log('🎉 Seeding complete!');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
