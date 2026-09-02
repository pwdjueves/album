import { AlbumPrivacy, type Prisma } from '@prisma/client';
import {
  albumRepository,
  type PublicAlbum,
  type PublicAlbumWithStructure,
} from '../repositories/album.repository.js';
import {
  canEditAlbumStructure,
  canDeleteAlbum,
  canViewAlbum,
  getAlbumAuthorizationContext,
  type AuthorizationActor,
} from './authorization.service.js';
import { AppError } from '../utils/app-error.js';
import type { CreateAlbumInput, UpdateAlbumInput } from '../validators/album.validator.js';

async function assertCategoryExists(categoryId: string): Promise<void> {
  if (!(await albumRepository.categoryExists(categoryId))) {
    throw new AppError('Category not found', 404);
  }
}

async function assertGroupMembership(groupId: string, userId: string): Promise<void> {
  if (!(await albumRepository.isGroupMember(groupId, userId))) {
    throw new AppError('You must belong to the group for a group album', 403);
  }
}

async function assertCanEdit(albumId: string, actor: AuthorizationActor): Promise<void> {
  const context = await getAlbumAuthorizationContext(albumId, actor);
  if (!context) {
    throw new AppError('Album not found', 404);
  }

  if (!canEditAlbumStructure(context)) {
    throw new AppError('You do not have permission to edit this album', 403);
  }
}

export const albumService = {
  async create(input: CreateAlbumInput, actor: AuthorizationActor): Promise<PublicAlbum> {
    await assertCategoryExists(input.categoryId);

    if (input.privacy === AlbumPrivacy.GROUP) {
      await assertGroupMembership(input.groupId!, actor.userId);
    }

    return albumRepository.create({ ...input, creatorId: actor.userId });
  },

  async list(actor: AuthorizationActor | null): Promise<PublicAlbum[]> {
    return albumRepository.findVisibleTo(actor?.userId);
  },

  async getById(id: string, actor: AuthorizationActor | null): Promise<PublicAlbumWithStructure> {
    const context = await getAlbumAuthorizationContext(id, actor);
    if (!context) {
      throw new AppError('Album not found', 404);
    }

    if (!canViewAlbum(context)) {
      throw new AppError('You do not have permission to view this album', 403);
    }

    const album = await albumRepository.findDetailedById(id);
    if (!album) {
      throw new AppError('Album not found', 404);
    }

    return album;
  },

  async update(id: string, input: UpdateAlbumInput, actor: AuthorizationActor): Promise<PublicAlbum> {
    await assertCanEdit(id, actor);
    const existing = await albumRepository.findById(id);
    if (!existing) {
      throw new AppError('Album not found', 404);
    }

    if (input.categoryId !== undefined) {
      await assertCategoryExists(input.categoryId);
    }

    const privacy = input.privacy ?? existing.privacy;
    const groupId = input.groupId === undefined ? existing.groupId : input.groupId;
    if (privacy === AlbumPrivacy.GROUP) {
      if (!groupId) {
        throw new AppError('A group album requires a groupId', 400);
      }
      await assertGroupMembership(groupId, actor.userId);
    }

    const data: Prisma.AlbumUncheckedUpdateInput = { ...input };
    if (input.privacy !== undefined && input.privacy !== AlbumPrivacy.GROUP && input.groupId === undefined) {
      data.groupId = null;
    }

    return albumRepository.update(id, data);
  },

  async delete(id: string, actor: AuthorizationActor): Promise<void> {
    const context = await getAlbumAuthorizationContext(id, actor);
    if (!context) throw new AppError('Album not found', 404);
    if (!canDeleteAlbum(context)) {
      throw new AppError('You do not have permission to delete this album', 403);
    }
    await albumRepository.delete(id);
  },
};
