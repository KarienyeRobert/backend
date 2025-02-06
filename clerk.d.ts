import { Clerk, Session } from '@clerk/express';

declare global {
    namespace Express {
        interface Request {
            auth?: {
                user?: Clerk.User;
                session?: Session;
            };
        }
    }
}
