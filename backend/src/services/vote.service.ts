import { Prisma } from '@prisma/client';
import { albumRepository } from '../repositories/album.repository.js';
import { voteRepository } from '../repositories/vote.repository.js';
import { canViewAlbum, getAlbumAuthorizationContext, type AuthorizationActor } from './authorization.service.js';
import { AppError } from '../utils/app-error.js';
import type { RankingQuery } from '../validators/vote.validator.js';

async function assertCanView(albumId: string, actor: AuthorizationActor | null): Promise<void> {
  const context = await getAlbumAuthorizationContext(albumId, actor);
  if (!context) throw new AppError('Album not found', 404);
  if (!canViewAlbum(context)) throw new AppError('You do not have permission to view this album', 403);
}

export const voteService = {
  async vote(albumId: string, actor: AuthorizationActor): Promise<{ count: number }> {
    await assertCanView(albumId, actor);
    try {
      await voteRepository.create(albumId, actor.userId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('You have already voted for this album', 409);
      }
      throw error;
    }
    return { count: await voteRepository.countByAlbum(albumId) };
  },

  async removeVote(albumId: string, actor: AuthorizationActor): Promise<void> {
    await assertCanView(albumId, actor);
    await voteRepository.remove(albumId, actor.userId);
  },

  async getVotes(albumId: string, actor: AuthorizationActor | null): Promise<{ count: number }> {
    await assertCanView(albumId, actor);
    return { count: await voteRepository.countByAlbum(albumId) };
  },

  async ranking(actor: AuthorizationActor | null, query: RankingQuery) {
    const skip = (query.page - 1) * query.limit;
    const rows = await voteRepository.ranking(actor?.userId, skip, query.limit + 1, query);
    const hasNextPage = rows.length > query.limit;
    const pageRows = hasNextPage ? rows.slice(0, query.limit) : rows;
    const albums = await albumRepository.findByIds(pageRows.map((row) => row.albumId));
    const albumById = new Map(albums.map((album) => [album.id, album]));

    return {
      items: pageRows.flatMap((row) => {
        const album = albumById.get(row.albumId);
        return album ? [{ album, voteCount: row._count.albumId }] : [];
      }),
      page: query.page,
      limit: query.limit,
      hasNextPage,
    };
  },
};
