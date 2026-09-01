import type { Request, Response, NextFunction } from 'express';
import { createHttpError } from '../../utils/httpError.js';
import { createOrganization as createOrganizationService } from '../../services/organisation.service.js';
import { createOrganizationSchema } from '../../schema/organisation.schema.js';

export const createOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('createOrganization request headers:', req.headers);
        console.log('createOrganization request body:', req.body);
        const userId = req.session?.userId as string | undefined;
        if (!userId) return next(createHttpError('Unauthorized', 401));
        console.log('Logging request body', req.body)

        const parsed = createOrganizationSchema.parse(req.body);

        const result = await createOrganizationService(parsed, userId);

        return res.status(201).json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};
