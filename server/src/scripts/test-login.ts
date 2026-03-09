import 'dotenv/config';
import axios from 'axios';
import path from 'path';

async function testLogin() {
    console.log('Current CWD:', process.cwd());
    console.log('Test file path:', __filename);
    const baseUrl = 'http://localhost:5001/api';
    const credentials = [
        { email: 'admin@nap.gov.in', password: 'Test@123' },
        { email: 'faculty1@nap.gov.in', password: 'Test@123' },
        { email: 'student1@nap.gov.in', password: 'Test@123' }
    ];

    for (const cred of credentials) {
        try {
            console.log(`Testing login for: ${cred.email}...`);
            const response = await axios.post(`${baseUrl}/auth/login`, cred);
            console.log(`✅ Login successful for ${cred.email}. Token received.`);
        } catch (error: any) {
            console.error(`❌ Login failed for ${cred.email}:`, error.response?.data?.error || error.message);
        }
    }
}

testLogin();
