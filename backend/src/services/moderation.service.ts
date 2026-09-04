import { Prisma } from '@prisma/client';
import { albumRepository } from '../repositories/album.repository.js';
import { AppError } from '../utils/app-error.js';
import type { AuthorizationActor } from './authorization.service.js';
import { canModerate } from './authorization.service.js';
import type { ModerationStatusInput } from '../validators/moderation.validator.js';

function assertModerator(actor: AuthorizationActor): void {
  if (!canModerate(actor)) throw new AppError('Moderation role required', 403);
}

export const moderationService = {
  async listAlbums(actor: AuthorizationActor) {
    assertModerator(actor);
    return albumRepository.findAllForModeration();
  },

  async collaborators(id: string, actor: AuthorizationActor) {
    assertModerator(actor);
    const album = await albumRepository.findCollaborators(id);
    if (!album) throw new AppError('Album not found', 404);
    return album;
  },

  async updateStatus(id: string, input: ModerationStatusInput, actor: AuthorizationActor) {
    assertModerator(actor);
    const album = await albumRepository.findById(id);
    if (!album) throw new AppError('Album not found', 404);
    return albumRepository.update(id, { status: input.status });
  },

  async deleteAlbum(id: string, actor: AuthorizationActor): Promise<void> {
    assertModerator(actor);
    try {
      await albumRepository.delete(id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('Album not found', 404);
      }
      throw error;
    }
  },
};
