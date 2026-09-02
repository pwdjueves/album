export type StorageUpload = {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
};

export interface StorageProvider {
  uploadImage(upload: StorageUpload): Promise<string>;
}
