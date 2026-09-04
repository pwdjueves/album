import assert from 'node:assert/strict';
import test from 'node:test';
import { AlbumPrivacy, AlbumStatus } from '@prisma/client';
import {
  canCompleteAlbum,
  canDeleteAlbum,
  canEditAlbumStructure,
  canManageAlbumStructure,
  canModerate,
  canViewAlbum,
} from '../dist/services/authorization.service.js';
import { createAlbumSchema, updateAlbumSchema } from '../dist/validators/album.validator.js';
import {
  createSlotSchema,
  reorderSlotsSchema,
  updateSlotSchema,
} from '../dist/validators/album-structure.validator.js';
import { hasExpectedImageSignature } from '../dist/middleware/photo-upload.middleware.js';
import { validateQuery } from '../dist/middleware/validate-query.middleware.js';
import { externalPhotoSchema } from '../dist/validators/photo.validator.js';
import { rankingQuerySchema } from '../dist/validators/vote.validator.js';
import { updateUserSchema } from '../dist/validators/admin.validator.js';

function context(overrides = {}) {
  return {
    albumId: 'album-id',
    privacy: AlbumPrivacy.PRIVATE,
    status: AlbumStatus.ACTIVE,
    isCreator: false,
    isCollaborator: false,
    isGroupMember: false,
    isAdministrator: false,
    isModerator: false,
    isAuthenticated: false,
    ...overrides,
  };
}

const actors = {
  visitor: {},
  authenticatedUser: { isAuthenticated: true },
  creator: { isAuthenticated: true, isCreator: true },
  collaborator: { isAuthenticated: true, isCollaborator: true },
  groupMember: { isAuthenticated: true, isGroupMember: true },
  nonMember: { isAuthenticated: true },
  moderator: { isAuthenticated: true, isModerator: true },
  admin: { isAuthenticated: true, isAdministrator: true },
};

function assertPermissions(privacy, actor, expected) {
  const album = context({ privacy, ...actor });
  assert.equal(canViewAlbum(album), expected.view);
  assert.equal(canCompleteAlbum(album), expected.complete);
  assert.equal(canEditAlbumStructure(album), expected.edit);
  assert.equal(canManageAlbumStructure(album), expected.edit);
}

test('PRIVATE permits only its creator', () => {
  for (const [name, actor] of Object.entries(actors)) {
    assertPermissions(AlbumPrivacy.PRIVATE, actor, {
      view: name === 'creator' || name === 'moderator' || name === 'admin',
      complete: name === 'creator',
      edit: name === 'creator' || name === 'moderator' || name === 'admin',
    });
  }
});

test('PUBLIC permits visitors to view and registered users to complete', () => {
  for (const [name, actor] of Object.entries(actors)) {
    assertPermissions(AlbumPrivacy.PUBLIC, actor, {
      view: true,
      complete: name !== 'visitor',
      edit: name === 'creator' || name === 'collaborator' || name === 'moderator' || name === 'admin',
    });
  }
});

test('GROUP permits only group members, with team members editing structure', () => {
  for (const [name, actor] of Object.entries(actors)) {
    assertPermissions(AlbumPrivacy.GROUP, actor, {
      view: name === 'groupMember' || name === 'moderator' || name === 'admin',
      complete: name === 'groupMember',
      edit: name === 'moderator' || name === 'admin',
    });
  }

  assertPermissions(
    AlbumPrivacy.GROUP,
    { isAuthenticated: true, isGroupMember: true, isCreator: true },
    { view: true, complete: true, edit: true },
  );
  assertPermissions(
    AlbumPrivacy.GROUP,
    { isAuthenticated: true, isGroupMember: true, isCollaborator: true },
    { view: true, complete: true, edit: true },
  );
  assert.equal(canDeleteAlbum(context({ privacy: AlbumPrivacy.GROUP, isCreator: true, isAuthenticated: true })), false);
  assert.equal(
    canDeleteAlbum(context({ privacy: AlbumPrivacy.GROUP, isCreator: true, isGroupMember: true, isAuthenticated: true })),
    true,
  );
});

test('inactive albums cannot be completed and moderation remains role-based', () => {
  assert.equal(canCompleteAlbum(context({ privacy: AlbumPrivacy.PUBLIC, isAuthenticated: true, status: AlbumStatus.INACTIVE })), false);
  assert.equal(canModerate({ userId: 'moderator', role: 'MODERATOR' }), true);
  assert.equal(canModerate({ userId: 'admin', role: 'ADMIN' }), true);
  assert.equal(canModerate({ userId: 'user', role: 'USER' }), false);
});

test('admin user updates require supported fields', () => {
  assert.equal(updateUserSchema.safeParse({ role: 'MODERATOR' }).success, true);
  assert.equal(updateUserSchema.safeParse({ isActive: false }).success, true);
  assert.equal(updateUserSchema.safeParse({ role: 'OWNER' }).success, false);
  assert.equal(updateUserSchema.safeParse({}).success, false);
});

test('album validation rejects a client-provided creator and incomplete group albums', () => {
  assert.equal(
    updateAlbumSchema.safeParse({ title: 'Changed', creatorId: 'cm12345678901234567890123' }).success,
    false,
  );
  assert.equal(
    createAlbumSchema.safeParse({
      title: 'Group album',
      categoryId: 'cm12345678901234567890123',
      privacy: AlbumPrivacy.GROUP,
    }).success,
    false,
  );
});

test('slot validators reject invalid positions, empty updates and duplicate reorder ids', () => {
  const slotId = 'c123456789012345678901234';
  assert.equal(createSlotSchema.safeParse({ prompt: 'A prompt', position: 0 }).success, false);
  assert.equal(updateSlotSchema.safeParse({}).success, false);
  assert.equal(reorderSlotsSchema.safeParse({ slotIds: [slotId, slotId] }).success, false);
});

test('photo completion accepts only HTTPS URLs and recognized image content', () => {
  assert.equal(
    externalPhotoSchema.safeParse({ sourceType: 'URL', imageUrl: 'https://images.example.test/photo.jpg' }).success,
    true,
  );
  assert.equal(
    externalPhotoSchema.safeParse({ sourceType: 'URL', imageUrl: 'http://images.example.test/photo.jpg' }).success,
    false,
  );
  assert.equal(hasExpectedImageSignature(Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg'), true);
  assert.equal(hasExpectedImageSignature(Buffer.from('<script>alert(1)</script>'), 'image/jpeg'), false);
});

test('ranking pagination is bounded and defaults to a stable first page', () => {
  assert.deepEqual(rankingQuerySchema.parse({}), { page: 1, limit: 20 });
  assert.equal(rankingQuerySchema.safeParse({ page: 0, limit: 20 }).success, false);
  assert.equal(rankingQuerySchema.safeParse({ page: 1, limit: 101 }).success, false);
});

test('query validation stores parsed values without assigning Express 5 request.query', () => {
  const middleware = validateQuery(rankingQuerySchema);
  const request = {
    get query() {
      return { page: '2', limit: '5' };
    },
  };
  const response = { locals: {} };
  let nextError;

  middleware(request, response, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.deepEqual(response.locals.validatedQuery, { page: 2, limit: 5 });
});
