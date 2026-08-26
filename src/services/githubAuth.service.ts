import argon2 from 'argon2';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';

type GithubUserData = {
    id: number | string;
    email?: string | null;
    login?: string;
    name?: string | null;
};

const randomPasswordHash = () => {
    return argon2.hash(crypto.randomBytes(32).toString('hex'));
};

const splitName = (name?: string | null, fallback = 'GitHub User') => {
    const parts = (name || fallback).trim().split(/\s+/);
    const firstName = parts.shift() || fallback;
    const lastName = parts.join(' ');

    return { firstName, lastName };
};

export const userLoginOrRegister = async (githubUserData: GithubUserData) => {
    if (!githubUserData.id) {
        throw new Error('GitHub account did not provide an id');
    }

    if (!githubUserData.email) {
        throw new Error('GitHub account did not provide a verified email address');
    }

    const providerUserId = String(githubUserData.id);
    const existingOauth = await prisma.oauth.findUnique({
        where: {
            provider_providerUserId: {
                provider: 'github',
                providerUserId,
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
            email: githubUserData.email,
        },
    });

    if (existingUser) {
        return prisma.user.update({
            where: {
                id: existingUser.id,
            },
            data: {
                isEmailVerified: true,
                oauths: {
                    create: {
                        provider: 'github',
                        providerUserId,
                    },
                },
            },
        });
    }

    const { firstName, lastName } = splitName(
        githubUserData.name,
        githubUserData.login || githubUserData.email.split('@')[0]
    );

    return prisma.user.create({
        data: {
            email: githubUserData.email,
            password: await randomPasswordHash(),
            firstName,
            lastName,
            isEmailVerified: true,
            oauths: {
                create: {
                    provider: 'github',
                    providerUserId,
                },
            },
        },
    });
};
