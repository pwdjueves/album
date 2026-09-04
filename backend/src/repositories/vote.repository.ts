import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { visibleAlbumWhere } from './album.repository.js';

export const voteRepository = {
  create(albumId: string, userId: string) {
    return prisma.vote.create({ data: { albumId, userId } });
  },

  remove(albumId: string, userId: string): Promise<void> {
    return prisma.vote.deleteMany({ where: { albumId, userId } }).then(() => undefined);
  },

  countByAlbum(albumId: string): Promise<number> {
    return prisma.vote.count({ where: { albumId } });
  },

  hasVoted(albumId: string, userId: string): Promise<boolean> {
    return prisma.vote.findUnique({ where: { albumId_userId: { albumId, userId } }, select: { id: true } }).then(Boolean);
  },

  findVotedAlbumIds(userId: string, albumIds: string[]): Promise<string[]> {
    return prisma.vote.findMany({ where: { userId, albumId: { in: albumIds } }, select: { albumId: true } }).then((votes) => votes.map((vote) => vote.albumId));
  },

  ranking(
    userId: string | undefined,
    skip: number,
    take: number,
    filters: { title?: string; categoryId?: string },
  ) {
    return prisma.album.findMany({
      where: {
        AND: [
          visibleAlbumWhere(userId),
          filters.title ? { title: { contains: filters.title } } : {},
          filters.categoryId ? { categoryId: filters.categoryId } : {},
        ],
      },
      select: { id: true, _count: { select: { votes: true } } },
      orderBy: [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take,
    });
  },
};
