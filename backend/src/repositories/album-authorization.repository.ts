import { prisma } from '../config/prisma.js';

export const albumAuthorizationRepository = {
  findAccessData(albumId: string, userId?: string) {
    const accessUserId = userId ?? '';
    return prisma.album.findUnique({
      where: { id: albumId },
      select: {
        id: true,
        creatorId: true,
        privacy: true,
        status: true,
        groupId: true,
        collaborators: {
          where: { userId: accessUserId },
          select: { id: true },
        },
        group: {
          select: {
            members: {
              where: { userId: accessUserId },
              select: { id: true },
            },
          },
        },
      },
    });
  },
};
