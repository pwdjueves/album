import type { Request, Response } from 'express';
import { moderationService } from '../services/moderation.service.js';
import { AppError } from '../utils/app-error.js';

function getId(request: Request): string {
  const { id } = request.params;
  if (typeof id !== 'string') throw new AppError('Invalid album id', 400);
  return id;
}

export const moderationController = {
  async listAlbums(request: Request, response: Response): Promise<void> {
    response.json({ albums: await moderationService.listAlbums(request.auth!) });
  },
  async collaborators(request: Request, response: Response): Promise<void> {
    response.json(await moderationService.collaborators(getId(request), request.auth!));
  },
  async updateStatus(request: Request, response: Response): Promise<void> {
    response.json({ album: await moderationService.updateStatus(getId(request), request.body, request.auth!) });
  },
  async deleteAlbum(request: Request, response: Response): Promise<void> {
    await moderationService.deleteAlbum(getId(request), request.auth!);
    response.status(204).send();
  },
};
