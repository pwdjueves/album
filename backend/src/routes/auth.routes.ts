import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate-body.middleware.js';
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from '../validators/auth.validator.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), authController.register);
authRouter.post('/login', validateBody(loginSchema), authController.login);
authRouter.get('/me', requireAuth, authController.me);
authRouter.patch('/me', requireAuth, validateBody(updateProfileSchema), authController.updateProfile);
authRouter.patch('/me/password', requireAuth, validateBody(changePasswordSchema), authController.changePassword);
