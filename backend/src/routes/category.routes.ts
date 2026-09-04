import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';

export const categoryRouter = Router();
categoryRouter.get('/', categoryController.list);
