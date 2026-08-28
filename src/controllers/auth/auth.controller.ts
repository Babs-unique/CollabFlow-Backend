import type { Request, Response, NextFunction } from "express";
import argon2 from "argon2";
import crypto from "node:crypto";
import { prisma } from "../../lib/prisma";
import emailService from "../../services/email.service.js";
import type {
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
  VerifyEmailBody,
 } from "../../interfaces/auth";
import { createHttpError } from "../../utils/httpError";
import { validateTurnstile } from "../../utils/cloudFlare"; 

const TOKEN_BYTES = 32;
const PASSWORD_RESET_EXPIRY_MS = 15 * 60 * 1000;
const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;

const createToken = () => {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  return { token, tokenHash };
};

const getClientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

const publicUser = (user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const register = async (
  req: Request<{}, {}, RegisterBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, firstName, lastName , cloudFlareToken } = req.body;

    if (!email || !password || !firstName || !lastName || !cloudFlareToken) {
      return next(createHttpError("All fields are required", 400));
    }

    const isTurnstileValid = await validateTurnstile(cloudFlareToken, req.ip);
    if(!isTurnstileValid.success || !isTurnstileValid) {
      return next(createHttpError("reCaptcha is not valid", 400));
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return next(createHttpError("User already exists", 409));
    }

    const { token, tokenHash } = createToken();
    const user = await prisma.user.create({
      data: {
        email,
        password: await argon2.hash(password),
        firstName,
        lastName,
        emailVerificationToken: tokenHash,
        emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS),
      },
    });

    const verificationUrl = `${getClientUrl()}/verify-email?token=${token}`;
    await emailService.sendVerificationEmail({
      to: user.email,
      firstName: user.firstName,
      verificationUrl,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: publicUser(user),
        ...(process.env.NODE_ENV !== "production" && {
          verificationToken: token,
          verificationUrl,
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password , cloudFlareToken } = req.body;

    if (!email || !password || !cloudFlareToken) {
      return next(createHttpError("All fields are required", 400));
    }

    const isTurnstileValid = await validateTurnstile(cloudFlareToken, req.ip);
    if(!isTurnstileValid.success || !isTurnstileValid) {
      return next(createHttpError("reCaptcha is not valid", 400));
    }
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await argon2.verify(user.password, password))) {
      return next(createHttpError("Invalid credentials", 401));
    }

    req.session.userId = user.id;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: "Failed to logout",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Logout successful",
    });
  });
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(req.session)
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });

    if (!user) {
      return next(createHttpError("Unauthorized", 401));
    }

    return res.status(200).json({
      success: true,
      data: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const sendEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });

    if (!user) {
      return next(createHttpError("Unauthorized", 401));
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified",
      });
    }

    const { token, tokenHash } = createToken();
    const verificationUrl = `${getClientUrl()}/verify-email?token=${token}`;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: tokenHash,
        emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS),
      },
    });

    await emailService.sendVerificationEmail({
      to: user.email,
      firstName: user.firstName,
      verificationUrl,
    });

    return res.status(200).json({
      success: true,
      message: "Email verification queued",
      ...(process.env.NODE_ENV !== "production" && {
        data: { verificationToken: token, verificationUrl },
      }),
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request<{}, {}, VerifyEmailBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(createHttpError("Verification token is required", 400));
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: tokenHash,
        emailVerificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return next(createHttpError("Invalid or expired verification token", 400));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Email verified",
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request<{}, {}, ForgotPasswordBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(createHttpError("Email is required", 400));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    let resetData: { resetToken: string; resetUrl: string } | undefined;

    if (user) {
      const { token, tokenHash } = createToken();
      const resetUrl = `${getClientUrl()}/reset-password?token=${token}`;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: tokenHash,
          passwordResetExpires: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
        },
      });

      await emailService.sendPasswordResetEmail({
        to: user.email,
        firstName: user.firstName,
        resetUrl,
      });

      resetData = { resetToken: token, resetUrl };
    }

    return res.status(200).json({
      success: true,
      message: "If that email exists, a password reset link has been queued",
      ...(process.env.NODE_ENV !== "production" && resetData && { data: resetData }),
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request<{}, {}, ResetPasswordBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return next(createHttpError("Token and password are required", 400));
    }

    if (password.length < 8) {
      return next(createHttpError("Password must be at least 8 characters", 400));
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return next(createHttpError("Invalid or expired reset token", 400));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await argon2.hash(password),
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    next(error);
  }
};
