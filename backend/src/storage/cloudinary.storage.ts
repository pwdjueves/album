import { createHmac } from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import type { StorageProvider, StorageUpload } from './storage.provider.js';

type CloudinaryResponse = {
  secure_url?: string;
  error?: { message?: string };
};

/** Cloudinary adapter; it is only used for uploaded files, never for external URLs. */
export class CloudinaryStorage implements StorageProvider {
  async uploadImage(upload: StorageUpload): Promise<string> {
    const { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret, cloudinaryUploadPreset } = env;
    if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret || !cloudinaryUploadPreset) {
      throw new AppError('Image storage is not configured', 503);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePayload = `timestamp=${timestamp}&upload_preset=${cloudinaryUploadPreset}`;
    const signature = createHmac('sha1', cloudinaryApiSecret).update(signaturePayload).digest('hex');
    const form = new FormData();
    form.append('file', new Blob([Uint8Array.from(upload.buffer)], { type: upload.mimeType }), upload.originalName);
    form.append('api_key', cloudinaryApiKey);
    form.append('timestamp', String(timestamp));
    form.append('upload_preset', cloudinaryUploadPreset);
    form.append('signature', signature);

    let response: Response;
    try {
      response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
        method: 'POST',
        body: form,
      });
    } catch {
      throw new AppError('Image storage is temporarily unavailable', 503);
    }

    const result = (await response.json()) as CloudinaryResponse;
    if (!response.ok || !result.secure_url) {
      throw new AppError(result.error?.message ?? 'Image upload failed', 502);
    }

    return result.secure_url;
  }
}

export const imageStorage: StorageProvider = new CloudinaryStorage();
