import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateResource.js';
import { createOrganization } from '../controllers/organizations/organisation.controller.js';
import { createOrganizationSchema } from '../schema/organisation.schema.js';

const router: Router = express.Router();

router.post('/', authMiddleware, validateRequest(createOrganizationSchema), createOrganization);

export default router;
