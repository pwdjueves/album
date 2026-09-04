import type { Request, Response } from 'express';
import { photoService } from '../services/photo.service.js';
import { AppError } from '../utils/app-error.js';
import type { ExternalPhotoInput } from '../validators/photo.validator.js';

function getParam(request: Request, name: string): string {
  const value = request.params[name];
  if (typeof value !== 'string') throw new AppError(`Invalid ${name}`, 400);
  return value;
}

function getActor(request: Request) {
  return { userId: request.auth!.userId, role: request.auth!.role };
}

export const photoController = {
  async complete(request: Request, response: Response): Promise<void> {
    const albumId = getParam(request, 'albumId');
    const pageId = getParam(request, 'pageId');
    const slotId = getParam(request, 'slotId');
    const actor = getActor(request);
    const photo = request.file
      ? await photoService.completeFromUpload(albumId, pageId, slotId, {
          buffer: request.file.buffer,
          mimeType: request.file.mimetype,
          originalName: request.file.originalname,
        }, actor)
      : await photoService.completeFromUrl(
          albumId,
          pageId,
          slotId,
          (request.body as ExternalPhotoInput).imageUrl,
          actor,
        );

    response.status(201).json({ photo });
  },
  async remove(request: Request, response: Response): Promise<void> {
    await photoService.removePhoto(getParam(request, 'albumId'), getParam(request, 'pageId'), getParam(request, 'slotId'), getActor(request));
    response.status(204).send();
  },
};
