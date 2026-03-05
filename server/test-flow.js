const axios = require('axios');
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

async function runTest() {
    try {
        console.log("=== Testing Student 6 (ST Category, UG) ===");
        let res = await api.post('/auth/login', { email: 'student6@nap.gov.in', password: 'Test@123' });
        const token6 = res.data.token;
        const api6 = axios.create({ baseURL: 'http://localhost:5000/api', headers: { Authorization: `Bearer ${token6}` } });
        
        console.log("1. Setting Admission Type (UG)");
        await api6.post('/student/set-admission-type', { admissionType: 'UG' });
        
        console.log("2. Manual Document Submission");
        await api6.post('/student/submit-documents', { manualDocs: { ssc: false, inter: false } });
        
        console.log("3. Fetching UG Courses");
        const coursesRes = await api6.get('/student/courses?admissionType=UG');
        const ugCourses = coursesRes.data;
        const selected = ugCourses.slice(0, 3).map(c => c.id);
        
        console.log(`4. Applying to ${selected.length} Courses`);
        await api6.post('/student/apply', { courseIds: selected, admissionType: 'UG' });

        console.log("=== Testing Student 7 (EWS Category, UG) ===");
        res = await api.post('/auth/login', { email: 'student7@nap.gov.in', password: 'Test@123' });
        const token7 = res.data.token;
        const api7 = axios.create({ baseURL: 'http://localhost:5000/api', headers: { Authorization: `Bearer ${token7}` } });
        
        await api7.post('/student/set-admission-type', { admissionType: 'UG' });
        await api7.post('/student/submit-documents', { manualDocs: { ssc: false, inter: false } });
        await api7.post('/student/apply', { courseIds: selected, admissionType: 'UG' });
        
        console.log("=== Testing Student 8 (GENERAL Category, PG) ===");
        res = await api.post('/auth/login', { email: 'student8@nap.gov.in', password: 'Test@123' });
        const token8 = res.data.token;
        const api8 = axios.create({ baseURL: 'http://localhost:5000/api', headers: { Authorization: `Bearer ${token8}` } });
        
        await api8.post('/student/set-admission-type', { admissionType: 'PG' });
        await api8.post('/student/submit-documents', { manualDocs: { ssc: false, inter: false, ug: false } });
        const pgCoursesRes = await api8.get('/student/courses?admissionType=PG');
        const pgCourses = pgCoursesRes.data;
        await api8.post('/student/apply', { courseIds: [pgCourses[0].id], admissionType: 'PG' });
        
        console.log("=== Students Applied Successfully ===");
        
    } catch(err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
runTest();
