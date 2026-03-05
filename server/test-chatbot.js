const axios = require('axios');

async function testChatbot() {
    try {
        console.log("=== Testing AI Chatbot ===");
        let res = await axios.post('http://localhost:5000/api/auth/login', { email: 'student1@nap.gov.in', password: 'Test@123' });
        const token = res.data.token;
        const api = axios.create({ baseURL: 'http://localhost:5000/api', headers: { Authorization: `Bearer ${token}` } });
        
        console.log("1. Sending message to Chatbot...");
        console.time("Chatbot Response Time");
        const chatRes = await api.post('/chatbot/message', { message: 'Can you tell me about the admission types?' });
        console.timeEnd("Chatbot Response Time");
        
        console.log("Chatbot Output:");
        console.log("Response:", chatRes.data.response);
        console.log("Using Provider:", chatRes.data.provider);
        
        console.log("2. Fetching Chat History...");
        const historyRes = await api.get('/chatbot/history');
        console.log(`- Found ${historyRes.data.length} messages in history.`);
        
        console.log("✅ Chatbot test complete!");
    } catch(err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
testChatbot();
