import type { Request, Response, NextFunction } from 'express';
import { createHttpError } from '../../utils/httpError.js';
import { createOrganization as createOrganizationService, getOrganizations as getOrganizationsService, joinOrganization as joinOrganizationService, deleteOrganization as deleteOrganizationService } from '../../services/organisation.service.js';
import { joinOrganizationSchema } from '../../schema/organisation.schema.js';
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


export const getOrganizations = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.session?.userId as string | undefined;
    if (!userId) return next(createHttpError('Unauthorized', 401));
    try {
        const orgs = await getOrganizationsService(userId);
        return res.status(200).json({ success: true, data: orgs });
    } catch (err) {
        next(err);
    }
};



export const joinOrganization = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.session?.userId as string | undefined;
    if(!userId){
        return next(createHttpError('Unauthorized', 401));
    }
    try{
        const { organizationId, invitationCode } = req.body;
        const result = await joinOrganizationService(userId, organizationId, invitationCode);
        return res.status(200).json({ success: true, data: result });
    }catch(err){
        next(err)
    }
}

export const deleteOrganization = async (req: 
    Request<{id: string}, {} , {}>, 
    res: Response,
    next: NextFunction) => {
    const userId = req.session?.userId as string | undefined;
    if (!userId) return next(createHttpError('Unauthorized', 401));
    try{
        const { id } = req.params;
        const result = await deleteOrganizationService(userId, id);
        return res.status(200).json({ success: true, data: result });
    }catch(err){
        next(err)
    }
}