import express, { Router } from 'express';
import {
    forgotPassword,
    login,
    logoutUser,
    me,
    register,
    resetPassword,
    sendEmailVerification,
    verifyEmail,
} from '../controllers/auth.controller.js';
import {
    getGoogleUserProfile,
    handleGoogleOauthCallback,
    initiateGoogleOAuth,
} from '../controllers/googleOauth.controller.js';
import {
    getGithubUser,
    handleGithubOauthCallback,
    initiateGithubOAuth,
} from '../controllers/githubOauth.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { loginSchema, registerSchema } from '../schema/auth.schema.js';
import { validateRequest } from '../middlewares/validateResource.js';

const router: Router = express.Router();

router.post('/register', validateRequest(registerSchema) ,  register);
router.post('/login', validateRequest( loginSchema ) ,  login);
router.post('/logout', authMiddleware, logoutUser);
router.get('/me', authMiddleware, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/send-email-verification', authMiddleware, sendEmailVerification);
router.post('/verify-email', verifyEmail);
router.get('/google', initiateGoogleOAuth);
router.get('/google/callback', handleGoogleOauthCallback);
router.get('/google/me', authMiddleware, getGoogleUserProfile);
router.get('/github', initiateGithubOAuth);
router.get('/github/callback', handleGithubOauthCallback);
router.get('/github/me', authMiddleware, getGithubUser);

export default router;
