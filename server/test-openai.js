require('dotenv').config();
const OpenAI = require('openai');

async function testOpenAI() {
    try {
        console.log("Key length:", process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 'MISSING');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        console.log("Connecting...");
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say hello' }]
        });
        
        console.log("Success:", completion.choices[0]?.message?.content);
    } catch(err) {
        console.error("OpenAI Error:", err.message);
    }
}
testOpenAI();
