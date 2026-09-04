import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate-body.middleware.js';
import { updateUserSchema } from '../validators/admin.validator.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN'));
adminRouter.get('/users', adminController.listUsers);
adminRouter.patch('/users/:userId', validateBody(updateUserSchema), adminController.updateUser);
adminRouter.delete('/users/:userId', adminController.deleteUser);
