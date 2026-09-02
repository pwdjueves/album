import multer from 'multer';
import type { RequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';
import { externalPhotoSchema, uploadPhotoSchema } from '../validators/photo.validator.js';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError('Only JPEG, PNG, and WebP image uploads are allowed', 400));
      return;
    }
    callback(null, true);
  },
});

export function hasExpectedImageSignature(buffer: Buffer, mimetype: string): boolean {
  if (mimetype === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimetype === 'image/png') {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  return (
    mimetype === 'image/webp' &&
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

export const validatePhotoCompletion: RequestHandler = (request, _response, next) => {
  const result = request.file ? uploadPhotoSchema.safeParse(request.body) : externalPhotoSchema.safeParse(request.body);
  if (!result.success) {
    next(new AppError('Invalid photo completion request', 400, result.error.issues));
    return;
  }
  if (request.file && !hasExpectedImageSignature(request.file.buffer, request.file.mimetype)) {
    next(new AppError('The uploaded file content does not match its image type', 400));
    return;
  }

  request.body = result.data;
  next();
};
