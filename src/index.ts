import express, { Request, Response } from 'express';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { StreamChat } from 'stream-chat';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

const streamClient = new StreamChat(process.env.STREAM_API_KEY as string, process.env.STREAM_API_SECRET as string);

app.use(clerkMiddleware());



app.post('/generate-stream-token', async (req:Request, res:Response)=>{
   try{
       const { userId } = getAuth(req);

       if (!userId) {
           res.status(401).json('Unauthorized');
       }

       const client = streamClient.createToken(userId!);

       res.json(client);
   }catch (err) {
       console.error('Error generating Stream token:', err);
           res.status(500).json({ error: 'Failed to generate Stream token' });
   }
})

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
