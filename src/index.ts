import express, { Request, Response, NextFunction } from 'express';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { StreamChat } from 'stream-chat';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
import { MentalHealthScenario } from './MentalHealthScenario';
import { ScenarioStates } from './types';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!STREAM_API_KEY || !STREAM_API_SECRET || !GEMINI_API_KEY) {
    console.error('Missing required environment variables');
    process.exit(1);
}

const streamClient = new StreamChat(STREAM_API_KEY, STREAM_API_SECRET);

app.use(express.json());
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : 'http://10.1.45.111:8081',
    credentials: true,
}));
app.use(clerkMiddleware());

// TypeScript interfaces
interface ChatMessage {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

// ✅ Health Check
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy' });
});

// ✅ Generate Stream Token
app.post('/generate-stream-token', async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { fullName, imageUrl } = req.body;

        await streamClient.upsertUser({
            id: userId,
            name: fullName,
            image: imageUrl,
        });

        const token = streamClient.createToken(userId);
        res.json({ token, apiKey: STREAM_API_KEY, userId });
    } catch (err) {
        console.error('Error generating Stream token:', err);
        res.status(500).json({ error: 'Failed to generate Stream token' });
    }
});

// ✅ Chatbot API using Gemini
app.post('/chat', async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { firstName, message, history = [] } = req.body;
        const userName = firstName || 'User';

        const mentalHealthScenario = new MentalHealthScenario();
        const systemPrompt = mentalHealthScenario.getSystemPrompt(
            history.length === 0 ? ScenarioStates.START : ScenarioStates.CONTINUE,
            userName
        );



        const chatHistory = history.map((msg:ChatMessage) => ({
            role: msg.role === "assistant" ? "model" : msg.role,
            parts: [{ text: msg.content }],
        }));

        const requestBody = {
            contents: [
                systemPrompt,
                ...chatHistory,
                { role: 'user', parts: [{ text: message }] },
            ],
        };


        console.log('Request Body:', JSON.stringify(requestBody, null, 2));

        const response = await axios.post(
            `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
            requestBody,
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log('Full API Response:', JSON.stringify(response.data, null, 2));

        // Check if the response has candidates
        const candidates = response.data?.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error('No candidates returned in API response.');
        }

        // Check if the first candidate has content and parts
        const content = candidates[0]?.content;
        if (!content || !content.parts || content.parts.length === 0) {
            throw new Error('Response content or parts is missing.');
        }

        // Extract the bot response
        const botResponse = content.parts[0]?.text || 'I am unable to respond at the moment.';

        res.json({ reply: botResponse });

    } catch (error: any) {
        console.error('Chatbot Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Chatbot failed to respond' });
    }
});



// ✅ Global Error Handling Middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ✅ Start the Server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
