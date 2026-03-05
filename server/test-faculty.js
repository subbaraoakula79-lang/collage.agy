const axios = require('axios');
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

async function runFacultyTest() {
    try {
        console.log("=== Faculty 1 (SVU) running Admission Rounds ===");
        let res = await api.post('/auth/login', { email: 'faculty1@nap.gov.in', password: 'Test@123' });
        const token1 = res.data.token;
        const apiFac1 = axios.create({ baseURL: 'http://localhost:5000/api', headers: { Authorization: `Bearer ${token1}` } });

        const courses1 = await apiFac1.get('/faculty/courses');
        const bscCS = courses1.data.find(c => c.code === 'BSC-CS');
        const mscCS = courses1.data.find(c => c.code === 'MSC-CS');
        
        console.log("Starting Round 1 for B.Sc CS...");
        await apiFac1.post(`/faculty/courses/${bscCS.id}/start-round`);
        console.log("Starting Round 1 for M.Sc CS...");
        await apiFac1.post(`/faculty/courses/${mscCS.id}/start-round`);

        console.log("=== Faculty 2 (AU) running Admission Rounds ===");
        res = await api.post('/auth/login', { email: 'faculty2@nap.gov.in', password: 'Test@123' });
        const token2 = res.data.token;
        const apiFac2 = axios.create({ baseURL: 'http://localhost:5000/api', headers: { Authorization: `Bearer ${token2}` } });

        const courses2 = await apiFac2.get('/faculty/courses');
        const btechECE = courses2.data.find(c => c.code === 'BTECH-ECE');
        
        console.log("Starting Round 1 for B.Tech ECE...");
        await apiFac2.post(`/faculty/courses/${btechECE.id}/start-round`);
        
        console.log("=== Students checking allotments & paying ===");

        // Student 6 checks allotment
        res = await api.post('/auth/login', { email: 'student6@nap.gov.in', password: 'Test@123' });
        const apiStu6 = axios.create({ baseURL: 'http://localhost:5000/api', headers: { Authorization: `Bearer ${res.data.token}` } });
        let allotments = await apiStu6.get('/student/allotments');
        
        if (allotments.data.length > 0) {
            console.log("Student 6 got a seat:", allotments.data[0].course.name);
            console.log("Accepting seat & Paying...");
            await apiStu6.post(`/student/allotment/${allotments.data[0].id}/respond`, { action: 'ACCEPTED' });
            
            const initRes = await apiStu6.post('/payment/initiate', { allotmentId: allotments.data[0].id, method: 'UPI' });
            await apiStu6.post('/payment/verify', { paymentId: initRes.data.payment.id });
            console.log("Payment successful for Student 6!");
        } else {
            console.log("Student 6 didn't get a seat.");
        }

        // Student 8 checks allotment
        res = await api.post('/auth/login', { email: 'student8@nap.gov.in', password: 'Test@123' });
        const apiStu8 = axios.create({ baseURL: 'http://localhost:5000/api', headers: { Authorization: `Bearer ${res.data.token}` } });
        allotments = await apiStu8.get('/student/allotments');
        
        if (allotments.data.length > 0) {
            console.log("Student 8 got a seat:", allotments.data[0].course.name);
            console.log("Accepting seat & Paying...");
            await apiStu8.post(`/student/allotment/${allotments.data[0].id}/respond`, { action: 'ACCEPTED' });
            
            const initRes = await apiStu8.post('/payment/initiate', { allotmentId: allotments.data[0].id, method: 'UPI' });
            await apiStu8.post('/payment/verify', { paymentId: initRes.data.payment.id });
            console.log("Payment successful for Student 8!");
        } else {
            console.log("Student 8 didn't get a seat.");
        }

        console.log("=== Flow Complete ===");

    } catch(err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
runFacultyTest();
