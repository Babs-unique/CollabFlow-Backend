import express from 'express';
import type{ Request, Response, Express, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv'
import session from 'express-session'
import { errorHandler } from './middlewares/errorHandler.js'
import apiRoutes from './routes/api.routes.js'
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis'; 

dotenv.config();

const app: Express = express();
app.use(express.json())
app.use(morgan('dev'));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
})
)

const redisClient = createClient({
    url: process.env.REDIS_URL
});
redisClient.on('error', err => console.log('Redis Client Error', err));

await redisClient.connect();

const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'collabflow:',
    ttl: 60 * 60 * 24 // 1 day
})


app.use(session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Set to true in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));



app.use('/api/v1' , apiRoutes);
app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to CollabFlow backend!');
});

// Catch not found routes
app.use((req: Request, res: Response) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
    });
});



app.use(errorHandler);
export default app;
