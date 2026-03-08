const axios = require('axios');
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

async function runTest() {
    try {
        console.log("=== Testing Student 1 (GENERAL, UG) ===");
        let res = await api.post('/auth/login', { email: 'student1@nap.gov.in', password: 'Test@123' });
        const token1 = res.data.token;
        const api1 = axios.create({ baseURL: 'http://localhost:5000/api', headers: { Authorization: `Bearer ${token1}` } });

        console.log("1. Setting Admission Type (UG)");
        await api1.post('/student/set-admission-type', { admissionType: 'UG' });

        console.log("2. Manual Document Submission");
        await api1.post('/student/submit-documents', { manualDocs: { ssc: false, inter: false } });

        console.log("3. Fetching UG Courses");
        const coursesRes = await api1.get('/student/courses?admissionType=UG');
        const ugCourses = coursesRes.data;
        const selected = ugCourses.slice(0, 3).map(c => c.id);

        console.log(`4. Applying to ${selected.length} Courses`);
        await api1.post('/student/apply', { courseIds: selected, admissionType: 'UG' });

        console.log("=== Testing Student 4 (GENERAL, PG) ===");
        res = await api.post('/auth/login', { email: 'student4@nap.gov.in', password: 'Test@123' });
        const token4 = res.data.token;
        const api4 = axios.create({ baseURL: 'http://localhost:5000/api', headers: { Authorization: `Bearer ${token4}` } });

        await api4.post('/student/set-admission-type', { admissionType: 'PG' });
        await api4.post('/student/submit-documents', { manualDocs: { ssc: false, inter: false, ug: false } });
        const pgCoursesRes = await api4.get('/student/courses?admissionType=PG');
        const pgCourses = pgCoursesRes.data;
        await api4.post('/student/apply', { courseIds: [pgCourses[0].id], admissionType: 'PG' });

        console.log("=== Students Applied Successfully ===");

    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
runTest();
