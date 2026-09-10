import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import type { StorageProvider, StorageUpload } from './storage.provider.js';

const extensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export class LocalStorage implements StorageProvider {
  async uploadImage(upload: StorageUpload): Promise<string> {
    const extension = extensions[upload.mimeType];
    if (!extension) throw new Error('Unsupported image type');
    await mkdir(env.uploadDir, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    await writeFile(path.join(env.uploadDir, filename), upload.buffer, { flag: 'wx' });
    return `/uploads/${filename}`;
  }
}
