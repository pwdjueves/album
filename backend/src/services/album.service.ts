import { AlbumPrivacy, type Prisma } from '@prisma/client';
import {
  albumRepository,
  type PublicAlbum,
  type PublicAlbumWithStructure,
} from '../repositories/album.repository.js';
import {
  canEditAlbumStructure,
  canDeleteAlbum,
  canModerate,
  canViewAlbum,
  getAlbumAuthorizationContext,
  type AuthorizationActor,
} from './authorization.service.js';
import { AppError } from '../utils/app-error.js';
import type { CreateAlbumInput, UpdateAlbumInput } from '../validators/album.validator.js';
import type { ModerationInput } from '../validators/album.validator.js';

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

    const { structure, ...albumData } = input;
    return albumRepository.create({
      title: albumData.title,
      description: albumData.description,
      privacy: albumData.privacy,
      status: albumData.status,
      category: { connect: { id: albumData.categoryId } },
      creator: { connect: { id: actor.userId } },
      ...(albumData.groupId ? { group: { connect: { id: albumData.groupId } } } : {}),
      ...(structure ? {
        pages: {
          create: structure.pages.map((page, pageIndex) => ({
            title: page.title,
            pageNumber: pageIndex + 1,
            photoSlots: { create: page.slots.map((slot, slotIndex) => ({ prompt: slot.prompt, position: slotIndex + 1 })) },
          })),
        },
      } : {}),
    });
  },

  async list(actor: AuthorizationActor | null): Promise<PublicAlbum[]> {
    return albumRepository.findVisibleTo(actor?.userId);
  },

  async listCreated(userId: string): Promise<PublicAlbum[]> {
    return albumRepository.findCreatedBy(userId);
  },

  async listCollaborated(userId: string): Promise<PublicAlbum[]> {
    return albumRepository.findCollaboratedBy(userId);
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

    const { structure, ...albumFields } = input;
    const data: Prisma.AlbumUncheckedUpdateInput = { ...albumFields };
    if (input.privacy !== undefined && input.privacy !== AlbumPrivacy.GROUP && input.groupId === undefined) {
      data.groupId = null;
    }

    const album = await albumRepository.update(id, data);
    if (structure) {
      try {
        await albumRepository.replaceStructure(id, structure.pages);
      } catch (error) {
        if (error instanceof Error && (error.message === 'INVALID_PAGE_ID' || error.message === 'INVALID_SLOT_ID')) {
          throw new AppError('The album structure contains an invalid page or slot', 400);
        }
        throw error;
      }
    }
    return album;
  },

  async delete(id: string, actor: AuthorizationActor): Promise<void> {
    const context = await getAlbumAuthorizationContext(id, actor);
    if (!context) throw new AppError('Album not found', 404);
    if (!canDeleteAlbum(context)) {
      throw new AppError('You do not have permission to delete this album', 403);
    }
    await albumRepository.delete(id);
  },

  async moderate(id: string, input: ModerationInput, actor: AuthorizationActor): Promise<PublicAlbum> {
    if (!canModerate(actor)) throw new AppError('Moderation role required', 403);
    const album = await albumRepository.findById(id);
    if (!album) throw new AppError('Album not found', 404);
    return albumRepository.update(id, { status: input.status });
  },
};
