import OpenAI from 'openai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.OPENAI_API_KEY;

async function testOpenAI() {
    if (!apiKey || apiKey === 'mock' || apiKey.startsWith('sk-proj-YOUR')) {
        console.error('❌ OPENAI_API_KEY is missing or mock');
        return;
    }

    try {
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Hello, are you working?' }]
        });
        console.log('✅ OpenAI Response:', completion.choices[0]?.message?.content);
    } catch (error: any) {
        console.error('❌ OpenAI Error:', error.message);
    }
}

testOpenAI();
