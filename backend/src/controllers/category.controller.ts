import type { Request, Response } from 'express';
import { categoryRepository } from '../repositories/category.repository.js';

export const categoryController = {
  async list(_request: Request, response: Response): Promise<void> {
    response.json({ categories: await categoryRepository.list() });
  },
};
