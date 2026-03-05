const axios = require('axios');

async function testAdmin() {
    try {
        console.log("=== Testing Admin Dashboard & Refunds ===");
        let res = await axios.post('http://localhost:5000/api/auth/login', { email: 'admin@nap.gov.in', password: 'Test@123' });
        const token = res.data.token;
        const api = axios.create({ baseURL: 'http://localhost:5000/api', headers: { Authorization: `Bearer ${token}` } });
        
        console.log("1. Fetching Admin Stats...");
        const stats = await api.get('/admin/dashboard');
        console.log(`- Students: ${stats.data.totalStudents}, Applications: ${stats.data.totalApplications}, Allotments: ${stats.data.totalAllotments}`);
        
        console.log("2. Fetching Payments...");
        const payments = await api.get('/admin/payments');
        console.log(`- Found ${payments.data.length} payments`);
        
        console.log("3. Fetching Audit Logs...");
        const logs = await api.get('/admin/audit-logs');
        console.log(`- Found ${logs.data.length} audit logs. Example actions: ${logs.data.slice(0, 3).map(l => l.action).join(', ')}`);
        
        // Ensure someone paid so we can test refunds
        const successfulPayments = payments.data.filter(p => p.status === 'SUCCESS');
        if (successfulPayments.length > 0) {
            console.log(`4. Initiating Refund for Payment ${successfulPayments[0].transactionId}...`);
            await api.post('/admin/refund', { paymentId: successfulPayments[0].id, reason: 'Test System Refund' });
            console.log('✅ Refund successful!');
        } else {
            console.log("⚠️ No successful payments found to test refund.");
        }
        
    } catch(err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
testAdmin();
