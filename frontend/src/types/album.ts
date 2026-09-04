export type Photo = {
  id: string;
  imageUrl: string;
  sourceType: 'UPLOAD' | 'URL';
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW';
  uploadedById: string;
};

export type PhotoSlot = {
  id: string;
  prompt: string;
  position: number;
  status: 'EMPTY' | 'COMPLETED';
  photo: Photo | null;
};

export type AlbumPage = { id: string; title: string; pageNumber: number; photoSlots: PhotoSlot[] };

export type AlbumPermissions = { canComplete: boolean; canModerate?: boolean };

export type Album = {
  id: string;
  title: string;
  description: string | null;
  privacy: 'PRIVATE' | 'PUBLIC' | 'GROUP';
  status: 'ACTIVE' | 'INACTIVE';
  creator: { id: string; firstName: string; lastName: string };
  category: { id: string; name: string };
  pages?: AlbumPage[];
  permissions?: AlbumPermissions;
};
export type RankedAlbum = { album: Album; voteCount: number; voted: boolean };
