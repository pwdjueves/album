import { prisma } from '../config/prisma.js';

export const categoryRepository = {
  list() {
    return prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  },
};
