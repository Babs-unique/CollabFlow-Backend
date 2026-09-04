import express , { Router } from 'express'
import authRouter from './auth.routes.js'
import organisationRouter from './organisation.routes.js'
import { authLimiter } from '../middlewares/rateLimit.js';

const router: Router = express.Router();
router.use('/auth', authLimiter, authRouter);
router.use('/organizations', organisationRouter);

export default router;


