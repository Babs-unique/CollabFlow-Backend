import { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error('Error Intercepted:', err.stack);

    if (res.headersSent) {
        return next(err);
    }

    // TypeScript reads incoming status code safely or falls back to 500
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};