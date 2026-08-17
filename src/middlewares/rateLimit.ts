import rateLimit from 'express-rate-limit';


export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.AUTH_MAX_REQUESTS || '50', 10), // Limit each IP to 50 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
    }
});