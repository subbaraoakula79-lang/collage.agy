import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const router = Router();
router.use(authenticate);

// Mock AI responses for different topics
const MOCK_RESPONSES: Record<string, string[]> = {
    eligibility: [
        'Eligibility is based on your previous qualification marks. For Inter admissions, SSC marks are considered. For UG, Intermediate marks. For PG, UG degree marks. Each course has a minimum percentage set by the faculty.',
        'You can check course-specific eligibility on the course details page. If you meet the minimum percentage, you can apply.'
    ],
    reservation: [
        'The reservation system follows government guidelines: General, OBC, SC, ST, and EWS categories. Each course has specific seat percentages for each category.',
        'Reserved category students can compete for General seats too. If you qualify on merit, you get a General seat, preserving reserved seats for others.'
    ],
    course: [
        'You can apply to up to 3 courses per admission type (Inter/UG/PG). Browse available courses on the Course Selection page. Check eligibility and seat availability before applying.',
        'Courses are offered by various colleges across Andhra Pradesh. Each course shows the total seats, fee structure, and eligibility criteria.'
    ],
    seat: [
        'Seat allotment happens in rounds (up to 3). After allotment, you can Accept (confirm), Freeze (lock your seat), or Wait for the next round for a better option.',
        'Once frozen, your seat is guaranteed but you cannot be upgraded in subsequent rounds. If you wait and don\'t get a better seat, you may lose your current allotment.'
    ],
    payment: [
        'Payment is required only after seat allotment. You have 15 minutes to complete payment once initiated. We support UPI, Cards, and Net Banking via Razorpay.',
        'If installment option is available, you can pay 50% upfront and the rest later. The seat is confirmed upon first payment.'
    ],
    scholarship: [
        'Some courses are marked as scholarship-eligible by the faculty. Check the course details for the scholarship flag. Manual verification is required before final admission.',
        'Scholarships are verified by the institution. If eligible, it will be reflected in your fee structure.'
    ],
    default: [
        'Welcome to the National Admission Portal! I can help you with questions about eligibility, reservation, course selection, seat allotment, payments, and scholarships. What would you like to know?',
        'I\'m the AI assistant for the Admission Portal. Ask me about the admission process, eligibility criteria, seat allocation, or payment procedures.'
    ]
};

function getMockResponse(message: string): { text: string; provider: string } {
    const lower = message.toLowerCase();
    let category = 'default';

    if (lower.includes('eligib') || lower.includes('qualify') || lower.includes('percentage') || lower.includes('marks')) category = 'eligibility';
    else if (lower.includes('reserv') || lower.includes('caste') || lower.includes('obc') || lower.includes('sc') || lower.includes('st') || lower.includes('ews') || lower.includes('category')) category = 'reservation';
    else if (lower.includes('course') || lower.includes('subject') || lower.includes('department') || lower.includes('branch')) category = 'course';
    else if (lower.includes('seat') || lower.includes('allot') || lower.includes('freeze') || lower.includes('accept') || lower.includes('wait')) category = 'seat';
    else if (lower.includes('pay') || lower.includes('fee') || lower.includes('razorpay') || lower.includes('upi') || lower.includes('install')) category = 'payment';
    else if (lower.includes('scholar') || lower.includes('financial') || lower.includes('aid')) category = 'scholarship';

    const responses = MOCK_RESPONSES[category];
    const text = responses[Math.floor(Math.random() * responses.length)];

    // Simulate provider fallback
    const providers = ['CHATGPT', 'GEMINI', 'GROK'];
    const provider = providers[Math.floor(Math.random() * providers.length)];

    return { text, provider };
}

let openai: OpenAI | null = null;
try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'mock' && !apiKey.startsWith('sk-proj-YOUR')) {
        openai = new OpenAI({ apiKey });
    } else {
        console.log('🤖 AI Chatbot: Using mock responses (No valid OPENAI_API_KEY found)');
    }
} catch (error) {
    console.error('❌ OpenAI Initialization Error:', error);
}

let genAI: GoogleGenerativeAI | null = null;
try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== 'mock') {
        genAI = new GoogleGenerativeAI(geminiKey);
    } else {
        console.log('🤖 AI Chatbot: Gemini not configured (GEMINI_API_KEY is mock or missing)');
    }
} catch (error) {
    console.error('❌ Gemini Initialization Error:', error);
}

// Configure AI Instructions with Website Context
const systemPrompt = `You are the "NAP AI Counselor", a highly intelligent and empathetic assistant for the National Admission Portal (NAP), Andhra Pradesh.
Your primary role is to guide students, parents, and faculty through the admission lifecycle with precision and professional warmth.

### Core Knowledge Base:
1. **Admissions Ecosystem**: Covers UG (B.A, B.Sc, B.Com), PG (M.A, M.Sc, M.Com), and Professional courses (B.Tech, BBA, MBA) across all recognized colleges in AP.
2. **Key Institutions**:
   - **PRGC (A), Kakinada**: Famous for BSC (IT) with a low fee of ₹11,985.
   - **Sri Venkateswara University (SVU)**: Top-tier for B.Sc CS (₹35,000) and M.Sc CS (₹45,000).
   - **Andhra University (AU)**: Offers premium B.Tech programs (₹68,000) and B.Com (₹25,000).
3. **Mandatory Procedures**:
   - **DigiLocker**: Absolute requirement. It automatically validates marks and certificates. If a student is stuck, explain that DigiLocker is used for "Instant Eligibility Verification".
   - **Course Preferences**: Students MUST select a minimum of 3 and up to 5 courses to ensure better allotment chances.
4. **Important Timelines**:
   - Seat Allotment is merit-based.
   - **15-Minute Payment Window**: Crucial! Once a student clicks 'Pay Fee', they must complete the transaction within 15 minutes to secure the seat.
5. **Reservations**: Strictly follows AP Govt norms (SC/ST/OBC/EWS/General).

### Interaction Guidelines:
- **Concise & Actionable**: Avoid long paragraphs. Use bullet points for steps.
- **Supportive Tone**: Use phrases like "I'm here to help you secure your future" or "Great choice of college!".
- **Security First**: Never ask for passwords. Remind users that OTPs are sent only to their registered mobile/email.
- **Contextual Awareness**: If a student is in the 'Onboarding' phase, prioritize explaining the DigiLocker and Profile completion steps.`;

// Send message
router.post('/message', async (req: AuthRequest, res, next) => {
    try {
        const { message, language } = req.body;
        if (!message) throw new AppError('Message is required');

        // Build language-specific instruction
        const langInstructions: Record<string, string> = {
            english: 'You MUST respond entirely in English.',
            telugu: 'You MUST respond entirely in Telugu (తెలుగు) script. Use Telugu characters only. Do NOT use English.',
            tenglish: 'You MUST respond in Tenglish — Telugu language written in English/Latin script. For example: "Meeru ela unnaru?" instead of "మీరు ఎలా ఉన్నారు?". Do NOT use Telugu script.',
            hindi: 'You MUST respond entirely in Hindi (हिन्दी) using Devanagari script. Do NOT use English.',
        };
        const langInstruction = langInstructions[language] || langInstructions.english;
        const localizedPrompt = systemPrompt + `\n\n### Language Instruction:\n${langInstruction}\nAlways follow this language rule strictly for every response.`;

        // Store user message
        await prisma.chatHistory.create({
            data: { userId: req.user!.id, role: 'user', message, provider: null }
        });

        let text = '';
        let provider = 'GEMINI';

        try {
            // Priority 1: Gemini (Primary provider)
            if (genAI) {
                try {
                    provider = 'GEMINI';
                    const model = genAI.getGenerativeModel({
                        model: "gemini-2.5-flash",
                        systemInstruction: localizedPrompt
                    });
                    const history = await prisma.chatHistory.findMany({
                        where: { userId: req.user!.id },
                        orderBy: { createdAt: 'desc' },
                        take: 6
                    });
                    const chat = model.startChat({
                        history: history.reverse().filter(h => h.message).map(h => ({
                            role: h.role === 'user' ? 'user' : 'model',
                            parts: [{ text: h.message }]
                        }))
                    });
                    const result = await chat.sendMessage(message);
                    const response = await result.response;
                    text = response.text();
                } catch (geminiError: any) {
                    console.error('Gemini Error:', geminiError.message);
                    if (openai) {
                        console.log('Falling back to OpenAI...');
                        provider = 'CHATGPT';
                        const history = await prisma.chatHistory.findMany({
                            where: { userId: req.user!.id },
                            orderBy: { createdAt: 'desc' },
                            take: 5
                        });
                        const msgs: any[] = history.reverse().map((h: any) => ({
                            role: h.role === 'user' ? 'user' : 'assistant',
                            content: h.message
                        }));
                        msgs.unshift({ role: 'system', content: localizedPrompt });

                        const completion = await openai.chat.completions.create({
                            model: 'gpt-4o-mini',
                            messages: [
                                ...msgs,
                                { role: 'user', content: message }
                            ]
                        });
                        text = completion.choices[0]?.message?.content || 'Sorry, I could not understand that.';
                    } else {
                        throw geminiError;
                    }
                }
            }
            // Priority 2: OpenAI (If Gemini not configured)
            else if (openai) {
                provider = 'CHATGPT';
                const history = await prisma.chatHistory.findMany({
                    where: { userId: req.user!.id },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                });
                const msgs: any[] = history.reverse().map((h: any) => ({
                    role: h.role === 'user' ? 'user' : 'assistant',
                    content: h.message
                }));
                msgs.unshift({ role: 'system', content: localizedPrompt });

                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        ...msgs,
                        { role: 'user', content: message }
                    ]
                });
                text = completion.choices[0]?.message?.content || 'Sorry, I could not understand that.';
            }
            else {
                throw new Error('No AI provider available');
            }
        } catch (error: any) {
            console.error('AI Error:', error.message);
            // Fallback to mock text
            const fallback = getMockResponse(message);
            text = fallback.text;
            provider = fallback.provider;
        }

        // Store assistant message
        await prisma.chatHistory.create({
            data: { userId: req.user!.id, role: 'assistant', message: text, provider }
        });

        res.json({ response: text, provider });
    } catch (err) { next(err); }
});

// Get chat history
router.get('/history', async (req: AuthRequest, res, next) => {
    try {
        const history = await prisma.chatHistory.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'asc' },
            take: 50
        });
        res.json(history);
    } catch (err) { next(err); }
});

export default router;
