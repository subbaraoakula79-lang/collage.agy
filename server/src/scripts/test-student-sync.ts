import axios from 'axios';

async function testStudentSync() {
    const baseUrl = 'http://localhost:5001/api';

    try {
        console.log("=== Testing Student Onboarding Sync ===");

        // 1. Login as Student 1
        console.log("1. Logging in as student1...");
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email: 'student1@nap.gov.in',
            password: 'Test@123'
        });
        const token = loginRes.data.token;
        const api = axios.create({
            baseURL: baseUrl,
            headers: { Authorization: `Bearer ${token}` }
        });

        // 2. Check Onboarding Status
        console.log("2. Checking onboarding status...");
        const statusRes = await api.get('/student/onboarding-status');
        const profile = statusRes.data;
        console.log(`✅ Current Onboarding Step: ${profile.onboardingStep}`);

        if (profile.onboardingStep === 'COMPLETE') {
            console.log("✅ SUCCESS: Student onboarding state is synchronized!");
        } else {
            console.log(`❌ FAILURE: Student onboarding state is still ${profile.onboardingStep}`);
        }

        console.log("=== Student Sync Test Completed ===");
    } catch (error: any) {
        console.error("❌ Test failed:", error.response?.data?.error || error.message);
    }
}

testStudentSync();
