import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const geminiKey = process.env.GEMINI_API_KEY;

async function testGemini() {
    if (!geminiKey || geminiKey === 'mock') {
        console.error('❌ GEMINI_API_KEY is missing or mock');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log('✅ Gemini Response:', response.text());
    } catch (error: any) {
        console.error('❌ Gemini Error:', error.message);
    }
}

testGemini();
