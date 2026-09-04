import type { Request, Response } from 'express';
import { adminService } from '../services/admin.service.js';
import { AppError } from '../utils/app-error.js';

function getUserId(request: Request): string {
  const { userId } = request.params;
  if (typeof userId !== 'string') throw new AppError('Invalid user id', 400);
  return userId;
}

export const adminController = {
  async listUsers(_request: Request, response: Response): Promise<void> {
    response.json({ users: await adminService.listUsers() });
  },
  async updateUser(request: Request, response: Response): Promise<void> {
    response.json({ user: await adminService.updateUser(getUserId(request), request.body, request.auth!) });
  },
  async deleteUser(request: Request, response: Response): Promise<void> {
    await adminService.deleteUser(getUserId(request), request.auth!);
    response.status(204).send();
  },
};
