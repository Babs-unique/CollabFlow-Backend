import type { Request, Response, NextFunction } from 'express';
import { githubConfig } from '../../configs/github.js';
import { githubAccessToken, githubUser } from '../../services/github.service.js';
import { userLoginOrRegister } from '../../services/githubAuth.service.js';
import { generateState, validateState, deleteState } from '../../utils/state.js';
import { generateCodeVerifier, generateCodeChallenge } from '../../utils/pkce.js';
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

export const initiateGithubOAuth = (
    req: Request<{}, {}, {}, { json?: string }>,
    res: Response,
    next: NextFunction
) => {
    try {
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = generateCodeChallenge(codeVerifier);
        const state = generateState({ codeVerifier });

        const authParams = new URLSearchParams({
            client_id: githubConfig.clientId,
            redirect_uri: githubConfig.redirectUri,
            scope: 'user:email',
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });

        const authUrl = `${githubConfig.authUrl}?${authParams.toString()}`;

        if (req.query.json === 'true' || req.headers.accept?.includes('application/json')) {
            return res.status(200).json({
                success: true,
                authUrl,
            });
        }

        //res.redirect(authUrl);
        return res.status(200).json({   
            success: true,
            authUrl
        });
    } catch (error) {
        logger.error({ err: error }, 'Error initiating GitHub OAuth');
        return next(createHttpError('Failed to initiate GitHub OAuth', 500));
    }
};

export const handleGithubOauthCallback = async (
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
        const accessToken = await githubAccessToken(code, stateData.codeVerifier);
        const githubUserData = await githubUser(accessToken);
        const user = await userLoginOrRegister(githubUserData);

        req.session.userId = user.id;
        deleteState(state);

        return res.redirect(clientCallbackUrl());
    } catch (error) {
        logger.error({ err: error }, 'Error handling GitHub OAuth callback');
        return next(createHttpError('Failed to authenticate with GitHub', 500));
    }
};

export const getGithubUser = async (
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
