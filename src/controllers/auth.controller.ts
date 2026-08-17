import type { Request, Response, NextFunction } from "express";
import argon2 from "argon2";
import { prisma } from "../lib/prisma";
import type { RegisterBody, LoginBody } from "../interfaces/auth";
import { createHttpError } from "../utils/httpError";
import crypto from 'crypto';


export const register = async (
  req: Request<{}, {}, RegisterBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return next(createHttpError("All fields are required", 400));
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(createHttpError("User already exists", 409));
    }

    const hashedPassword = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
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
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createHttpError("Email and password are required", 400));
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(createHttpError("Invalid credentials", 401));
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      return next(createHttpError("Invalid credentials", 401));
    }
    req.session.userId = user.id;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = ( req: Request, res: Response ) => {
    //Destroy user session
    req.session.destroy((err ) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to logout'
            });
        }
        return res.status(200).json({
            status: 'success',
            message: 'Logout successful'
        });
    });
}


export const sendEmail = async ( req: Request , res: Response , next: NextFunction ) => {

    const userId = req.session.userId;
    if(!userId){
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized'
        })
    }
    try{
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if(!user){
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized'
        })
      }
      return res.status(200).json({
        status: 'success',
        message: 'Email verification sent'
      })
    }catch(e){
      next(e)
    }
}

export const verifyEmail = async ( req: Request , res: Response , next: NextFunction ) => {

    const userId = req.session.userId;
    if(!userId){
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized'
        })
    }
    const { token } = req.body
    try{
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if(!user){
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized'
        })
      }
      return res.status(200).json({
        status: 'success',
        message: 'Email verified'
      })
    }catch(e){
      next(e)
    }
}


