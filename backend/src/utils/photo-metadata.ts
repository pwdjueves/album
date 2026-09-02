export function withImageUrl<T extends { imageUrl: string }>(photo: T): T {
  return photo;
}
