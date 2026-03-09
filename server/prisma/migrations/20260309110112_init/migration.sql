-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "phone" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "otp" TEXT,
    "otpExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "aadhaarEncrypted" TEXT,
    "aadhaarHash" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "state" TEXT NOT NULL DEFAULT 'Andhra Pradesh',
    "houseNo" TEXT,
    "street" TEXT,
    "village" TEXT,
    "mandal" TEXT,
    "district" TEXT,
    "pincode" TEXT,
    "address" TEXT,
    "corrAddress" TEXT,
    "fatherName" TEXT,
    "motherName" TEXT,
    "guardianName" TEXT,
    "parentMobile" TEXT,
    "parentOccupation" TEXT,
    "annualIncome" REAL,
    "minority" BOOLEAN NOT NULL DEFAULT false,
    "physicallyHandicapped" BOOLEAN NOT NULL DEFAULT false,
    "sportsQuota" BOOLEAN NOT NULL DEFAULT false,
    "admissionType" TEXT,
    "onboardingStep" TEXT NOT NULL DEFAULT 'REGISTERED',
    "sscHallTicket" TEXT,
    "sscBoard" TEXT,
    "sscYearOfPassing" TEXT,
    "sscMarks" REAL,
    "sscTotal" REAL,
    "sscPercentage" REAL,
    "sscGrade" TEXT,
    "interHallTicket" TEXT,
    "interBoard" TEXT,
    "interGroup" TEXT,
    "interYearOfPassing" TEXT,
    "interMarks" REAL,
    "interTotal" REAL,
    "interPercentage" REAL,
    "ugMarks" REAL,
    "ugTotal" REAL,
    "ugPercentage" REAL,
    "sscCertUrl" TEXT,
    "interCertUrl" TEXT,
    "ugCertUrl" TEXT,
    "casteCertUrl" TEXT,
    "incomeCertUrl" TEXT,
    "disabilityCertUrl" TEXT,
    "sportsCertUrl" TEXT,
    "sscDocStatus" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
    "interDocStatus" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
    "ugDocStatus" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
    "casteDocStatus" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
    "incomeDocStatus" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
    "digilockerToken" TEXT,
    "digilockerVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FacultyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "collegeId" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FacultyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FacultyProfile_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "College" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL DEFAULT '86390',
    "address" TEXT,
    "state" TEXT NOT NULL DEFAULT 'Andhra Pradesh',
    "city" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "admissionType" TEXT NOT NULL,
    "admissionMode" TEXT NOT NULL DEFAULT 'MERIT',
    "totalSeats" INTEGER NOT NULL,
    "eligibilityPercentage" REAL NOT NULL DEFAULT 0,
    "tuitionFee" REAL NOT NULL DEFAULT 0,
    "labFee" REAL NOT NULL DEFAULT 0,
    "libraryFee" REAL NOT NULL DEFAULT 0,
    "otherFee" REAL NOT NULL DEFAULT 0,
    "totalFee" REAL NOT NULL DEFAULT 0,
    "installmentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scholarshipEnabled" BOOLEAN NOT NULL DEFAULT false,
    "unfilledSeatRule" TEXT NOT NULL DEFAULT 'CONVERT_TO_GENERAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReservationMatrix" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    "seats" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReservationMatrix_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "admissionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "appliedMarks" REAL,
    "preference" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Application_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Round_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdmissionPhase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "admissionType" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Allotment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ALLOTTED',
    "seatLocked" BOOLEAN NOT NULL DEFAULT false,
    "seatLockedAt" DATETIME,
    "seatExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Allotment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Allotment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Allotment_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "allotmentId" TEXT,
    "amount" REAL NOT NULL,
    "method" TEXT,
    "gateway" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "transactionId" TEXT,
    "gatewayPaymentId" TEXT,
    "gatewaySignature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isInstallment" BOOLEAN NOT NULL DEFAULT false,
    "installmentNumber" INTEGER,
    "paidAt" DATETIME,
    "receiptUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" DATETIME,
    "processedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DigiLockerSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "maskedName" TEXT,
    "pinAttempts" INTEGER NOT NULL DEFAULT 0,
    "pinVerified" BOOLEAN NOT NULL DEFAULT false,
    "otpSent" BOOLEAN NOT NULL DEFAULT false,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "token" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChatHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "provider" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_aadhaarHash_key" ON "StudentProfile"("aadhaarHash");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_userId_key" ON "FacultyProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "College_code_key" ON "College"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationMatrix_courseId_category_key" ON "ReservationMatrix"("courseId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Application_studentId_courseId_key" ON "Application"("studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Round_courseId_roundNumber_key" ON "Round"("courseId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionPhase_admissionType_key" ON "AdmissionPhase"("admissionType");
