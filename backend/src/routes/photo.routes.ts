import { Router } from 'express';
import { photoController } from '../controllers/photo.controller.js';
import { photoUpload, validatePhotoCompletion } from '../middleware/photo-upload.middleware.js';

export const photoRouter = Router({ mergeParams: true });

photoRouter.post('/', photoUpload.single('file'), validatePhotoCompletion, photoController.complete);
photoRouter.delete('/', photoController.remove);
