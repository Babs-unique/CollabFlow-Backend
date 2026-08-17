import express , { Router } from 'express'
import authRouter from './auth.routes.js'
import { authLimiter } from '../middlewares/rateLimit.js';

const router: Router = express.Router();
router.use('/auth', authLimiter, authRouter);


export default router;


