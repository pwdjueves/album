import { AlbumPrivacy, AlbumStatus, type UserRole } from '@prisma/client';
import { albumAuthorizationRepository } from '../repositories/album-authorization.repository.js';

export type AuthorizationActor = {
  userId: string;
  role: UserRole;
};

export type AlbumAuthorizationContext = {
  albumId: string;
  privacy: AlbumPrivacy;
  status: AlbumStatus;
  isCreator: boolean;
  isCollaborator: boolean;
  isGroupMember: boolean;
  isAdministrator: boolean;
  isModerator: boolean;
  isAuthenticated: boolean;
};

export async function getAlbumAuthorizationContext(
  albumId: string,
  actor: AuthorizationActor | null,
): Promise<AlbumAuthorizationContext | null> {
  const album = await albumAuthorizationRepository.findAccessData(albumId, actor?.userId);
  if (!album) {
    return null;
  }

  return {
    albumId: album.id,
    privacy: album.privacy,
    status: album.status,
    isCreator: album.creatorId === actor?.userId,
    isCollaborator: album.collaborators.length > 0,
    isGroupMember: (album.group?.members.length ?? 0) > 0,
    isAdministrator: actor ? isAdministrator(actor) : false,
    isModerator: actor ? canModerate(actor) : false,
    isAuthenticated: actor !== null,
  };
}

export function isAdministrator(actor: AuthorizationActor): boolean {
  return actor.role === 'ADMIN';
}

export function isCreator(context: AlbumAuthorizationContext): boolean {
  return context.isCreator;
}

export function isCollaborator(context: AlbumAuthorizationContext): boolean {
  return context.isCollaborator;
}

export function belongsToAlbumGroup(context: AlbumAuthorizationContext): boolean {
  return context.isGroupMember;
}

export function canViewAlbum(context: AlbumAuthorizationContext): boolean {
  if (context.privacy === AlbumPrivacy.PRIVATE) return context.isCreator;
  if (context.privacy === AlbumPrivacy.PUBLIC) return true;
  return context.isGroupMember;
}

export function canCompleteAlbum(context: AlbumAuthorizationContext): boolean {
  if (!context.isAuthenticated || context.status !== AlbumStatus.ACTIVE) return false;
  if (context.privacy === AlbumPrivacy.PRIVATE) return context.isCreator;
  if (context.privacy === AlbumPrivacy.PUBLIC) return true;
  return context.isGroupMember;
}

export function canEditAlbumStructure(context: AlbumAuthorizationContext): boolean {
  return canManageAlbumStructure(context);
}

/** Structural edits inside an album are intentionally limited to its team. */
export function canManageAlbumStructure(context: AlbumAuthorizationContext): boolean {
  if (context.privacy === AlbumPrivacy.PRIVATE) return context.isCreator;
  if (context.privacy === AlbumPrivacy.PUBLIC) return context.isCreator || context.isCollaborator;
  return context.isGroupMember && (context.isCreator || context.isCollaborator);
}

export function canDeleteAlbum(context: AlbumAuthorizationContext): boolean {
  return context.isCreator && (context.privacy !== AlbumPrivacy.GROUP || context.isGroupMember);
}

export function canModerate(actor: AuthorizationActor): boolean {
  return actor.role === 'MODERATOR' || actor.role === 'ADMIN';
}
