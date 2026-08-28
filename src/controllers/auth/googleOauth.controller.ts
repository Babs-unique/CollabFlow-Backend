import type { Request, Response, NextFunction } from 'express';
import { googleConfig } from '../../configs/google.js';
import { googleAccessToken, googleUser } from '../../services/google.service.js';
import { userLoginOrRegister } from '../../services/googleAuth.service.js';
import { generateCodeVerifier, generateCodeChallenge } from '../../utils/pkce.js';
import { generateState, validateState, deleteState } from '../../utils/state.js';
import { prisma } from '../../lib/prisma.js';
import { createHttpError } from '../../utils/httpError.js';
import logger from '../../lib/logger.js';

const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;

const clientCallbackUrl = () => {
    return `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback`;
};

const publicUser = (user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
}) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isEmailVerified: user.isEmailVerified,
});

export const initiateGoogleOAuth = (
    req: Request<{}, {}, {}, { json?: string }>,
    res: Response,
    next: NextFunction
) => {
    try {
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = generateCodeChallenge(codeVerifier);
        const state = generateState({ codeVerifier });

        const authParams = new URLSearchParams({
            client_id: googleConfig.clientId,
            redirect_uri: googleConfig.redirectUri,
            scope: 'openid email profile',
            response_type: 'code',
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });

        const authUrl = `${googleConfig.authUrl}?${authParams.toString()}`;

        if (req.query.json === 'true' || req.headers.accept?.includes('application/json')) {
            return res.status(200).json({
                success: true,
                authUrl,
            });
        }

        // return res.redirect(authUrl);
        return res.status(200).json({   
            success: true,
            authUrl
        })
    } catch (error) {
        logger.error({ err: error }, 'Error initiating Google OAuth');
        return next(createHttpError('Failed to initiate Google OAuth', 500));
    }
};

export const handleGoogleOauthCallback = async (
    req: Request<{}, {}, {}, { code?: string; state?: string }>,
    res: Response,
    next: NextFunction
) => {
    const { code, state } = req.query;

    if (!code || !state) {
        return next(createHttpError('Missing OAuth code or state', 400));
    }

    const stateData = validateState(state);

    if (!stateData?.codeVerifier) {
        return next(createHttpError('Invalid state parameter', 400));
    }

    if (Date.now() - stateData.createdAt > OAUTH_STATE_TTL_MS) {
        deleteState(state);
        return next(createHttpError('State parameter has expired', 400));
    }

    try {
        const accessToken = await googleAccessToken(code, stateData.codeVerifier);
        const googleUserData = await googleUser(accessToken);
        const user = await userLoginOrRegister(googleUserData);

        req.session.userId = user.id;
        deleteState(state);

        return res.redirect(clientCallbackUrl());
    } catch (error) {
        logger.error({ err: error }, 'Error handling Google OAuth callback');
        return next(createHttpError('Failed to authenticate with Google', 500));
    }
};

export const getGoogleUserProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return next(createHttpError('Unauthorized', 401));
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return next(createHttpError('User not found', 404));
        }

        return res.status(200).json({
            success: true,
            data: publicUser(user),
        });
    } catch (error) {
        next(error);
    }
};
