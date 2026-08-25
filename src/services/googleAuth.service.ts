import argon2 from 'argon2';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';

type GoogleUserData = {
    sub: string;
    email?: string;
    email_verified?: boolean;
    given_name?: string;
    family_name?: string;
    name?: string;
};

const randomPasswordHash = () => {
    return argon2.hash(crypto.randomBytes(32).toString('hex'));
};

export const userLoginOrRegister = async (googleUserData: GoogleUserData) => {
    if (!googleUserData.sub) {
        throw new Error('Google account did not provide an id');
    }

    if (!googleUserData.email) {
        throw new Error('Google account did not provide an email address');
    }

    const existingOauth = await prisma.oauth.findUnique({
        where: {
            provider_providerUserId: {
                provider: 'google',
                providerUserId: googleUserData.sub,
            },
        },
        include: {
            user: true,
        },
    });

    if (existingOauth) {
        return existingOauth.user;
    }

    const existingUser = await prisma.user.findUnique({
        where: {
            email: googleUserData.email,
        },
    });

    if (existingUser) {
        return prisma.user.update({
            where: {
                id: existingUser.id,
            },
            data: {
                isEmailVerified: existingUser.isEmailVerified || Boolean(googleUserData.email_verified),
                oauths: {
                    create: {
                        provider: 'google',
                        providerUserId: googleUserData.sub,
                    },
                },
            },
        });
    }

    return prisma.user.create({
        data: {
            email: googleUserData.email,
            password: await randomPasswordHash(),
            firstName: googleUserData.given_name || googleUserData.name || googleUserData.email.split('@')[0],
            lastName: googleUserData.family_name || '',
            isEmailVerified: Boolean(googleUserData.email_verified),
            oauths: {
                create: {
                    provider: 'google',
                    providerUserId: googleUserData.sub,
                },
            },
        },
    });
};
