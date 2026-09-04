import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { createHttpError } from '../utils/httpError.js';

declare global {
  namespace Express {
    interface Request {
      userRole?: string;
      organizationId?: string;
      membership?: {
        id: string;
        userId: string;
        organizationId: string;
        roleId: string;
        status: string;
        role: {
          id: string;
          name: string;
          description: string;
        };
      };
    }
  }
}

const getOrganizationIdFromRequest = (req: Request): string | undefined => {
  const fromParams =
    (req.params?.organizationId as string | undefined) ??
    (req.params?.orgId as string | undefined) ??
    (req.params?.id as string | undefined);

  if (fromParams) return fromParams;

  const fromBody =
    (req.body?.organizationId as string | undefined) ??
    (req.body?.orgId as string | undefined);

  if (fromBody) return fromBody;

  const fromQuery =
    (req.query?.organizationId as string | undefined) ??
    (req.query?.orgId as string | undefined);

  return fromQuery;
};

export const rbacMiddleware = (requiredRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.session?.userId as string | undefined;

    if (!userId) {
      return next(createHttpError('Unauthorized', 401));
    }

    const organizationId = getOrganizationIdFromRequest(req);

    if (!organizationId) {
      return next(createHttpError('Organization id is required for this route', 400));
    }

    try {
      const membership = await prisma.membership.findFirst({
        where: {
          userId,
          organizationId,
          status: 'ACTIVE',
        },
        include: {
          role: true,
        },
      });

      if (!membership) {
        return next(createHttpError('Forbidden: not a member of this organization', 403));
      }

      const roleName = membership.role.name;

      if (!requiredRoles.includes(roleName)) {
        return next(createHttpError('Forbidden: insufficient permissions', 403));
      }

      req.userRole = roleName;
      req.organizationId = organizationId;
      req.membership = membership;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireOrganizationRole = (allowedRoles: string[]) => rbacMiddleware(allowedRoles);
