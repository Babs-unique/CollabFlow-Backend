import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateResource.js';
import { createOrganization, getOrganizations, joinOrganization, deleteOrganization } from '../controllers/organizations/organisation.controller.js';
import { createOrganizationSchema, joinOrganizationSchema } from '../schema/organisation.schema.js';

const router: Router = express.Router();

router.post('/', authMiddleware, validateRequest(createOrganizationSchema), createOrganization);
router.get('/', authMiddleware, getOrganizations);
router.post('/join', authMiddleware, validateRequest(joinOrganizationSchema), joinOrganization);
router.delete('/:id', authMiddleware, deleteOrganization);

export default router;
