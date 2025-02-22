import express, { Request, Response } from 'express';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { StreamChat } from 'stream-chat';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;

if (!STREAM_API_KEY || !STREAM_API_SECRET) {
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

// Health checkpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy' });
});

// Generate stream token
app.post('/generate-stream-token', async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get user data from request body
        const { fullName, imageUrl } = req.body;

        await streamClient.upsertUser({
            id: userId,
            name: fullName,
            image: imageUrl
        });

        const token = streamClient.createToken(userId);

        res.json({
            token,
            apiKey: STREAM_API_KEY,
            userId
        });
    } catch (err) {
        console.error('Error generating Stream token:', err);
        res.status(500).json({ error: 'Failed to generate Stream token' });
    }
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: Function) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});