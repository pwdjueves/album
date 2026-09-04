import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import type { ChangePasswordInput, LoginInput, RegisterInput, UpdateProfileInput } from '../validators/auth.validator.js';

export const authController = {
  async register(request: Request, response: Response): Promise<void> {
    const result = await authService.register(request.body as RegisterInput);
    response.status(201).json(result);
  },

  async login(request: Request, response: Response): Promise<void> {
    const result = await authService.login(request.body as LoginInput);
    response.status(200).json(result);
  },

  async me(request: Request, response: Response): Promise<void> {
    const user = await authService.getCurrentUser(request.auth!.userId);
    response.status(200).json({ user });
  },

  async updateProfile(request: Request, response: Response): Promise<void> {
    const user = await authService.updateProfile(request.auth!.userId, request.body as UpdateProfileInput);
    response.status(200).json({ user });
  },

  async changePassword(request: Request, response: Response): Promise<void> {
    await authService.changePassword(request.auth!.userId, request.body as ChangePasswordInput);
    response.status(204).send();
  },
};
