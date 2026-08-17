import type { Request, Response, NextFunction } from 'express';
import 'express-session';

declare module 'express-session' {
    interface SessionData {
        userId?: string;
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    //getting session cookie
    const sessionCookie = req.cookies['connect.sid'] ;

    if(!sessionCookie){
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized'
        })
    }
    if (!req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized'
        })
    }

    next();

};
