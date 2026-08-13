import express from 'express';
import type{ Request, Response, Express, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv'
import { errorHandler } from './middlewares/errorHandler.js'



dotenv.config();

const app: Express = express();
app.use(express.json())
app.use(morgan('dev'));
app.use(cookieParser());








app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to CollabFlow backend!');
});
//Catch not found routes
app.use('/{:splat}', (req: Request, res: Response) => {
    res.status(404).json({ 
        status: 'error', 
        message: 'Route not found' 
    });
});



app.use(errorHandler);
export default app;
