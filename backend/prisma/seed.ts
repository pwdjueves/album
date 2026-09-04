import argon2 from 'argon2';
import { PrismaClient, AlbumPrivacy, AlbumStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('AlbumDev123!', { type: argon2.argon2id });
  const admin = await prisma.user.upsert({ where: { email: 'admin@album.local' }, update: { role: 'ADMIN' }, create: { firstName: 'Admin', lastName: 'Album', birthDate: new Date('1980-01-01'), email: 'admin@album.local', passwordHash, role: 'ADMIN' } });
  const creator = await prisma.user.upsert({ where: { email: 'creator@album.local' }, update: {}, create: { firstName: 'Rock', lastName: 'Creator', birthDate: new Date('1990-01-01'), email: 'creator@album.local', passwordHash } });
  const collaborator = await prisma.user.upsert({ where: { email: 'collaborator@album.local' }, update: {}, create: { firstName: 'Rock', lastName: 'Collaborator', birthDate: new Date('1991-01-01'), email: 'collaborator@album.local', passwordHash } });
  const categoryNames = [
    'Rock', 'Rock Internacional', 'Rock Nacional', 'Familia', 'Paisajes', 'Sociedad',
    'Animales', 'Viajes', 'Naturaleza', 'Amigos', 'Celebraciones', 'Comida',
    'Arte', 'Deportes', 'Música', 'Ciudades', 'Trabajo', 'Aventuras',
  ];
  const categories = new Map<string, { id: string }>();
  for (const name of categoryNames) {
    categories.set(name, await prisma.category.upsert({ where: { name }, update: { name }, create: { name } }));
  }
  async function album(title: string, categoryId: string, ownerId: string) {
    const id = `seed-${title.includes('Internacional') ? 'international' : 'national'}`;
    const result = await prisma.album.upsert({ where: { id }, update: { categoryId, creatorId: ownerId, title, description: `Colección de ${title}`, privacy: AlbumPrivacy.PUBLIC, status: AlbumStatus.ACTIVE }, create: { id, title, description: `Colección de ${title}`, category: { connect: { id: categoryId } }, creator: { connect: { id: ownerId } }, privacy: AlbumPrivacy.PUBLIC, status: AlbumStatus.ACTIVE } });
    await prisma.page.deleteMany({ where: { albumId: result.id } });
    await prisma.album.update({ where: { id: result.id }, data: { pages: { create: [1, 2].map((pageNumber) => ({ title: `Página ${pageNumber}`, pageNumber, photoSlots: { create: ['Foto de una banda', 'Foto de un concierto', 'Foto de un guitarrista', 'Foto del público', 'Momento inolvidable'].map((prompt, index) => ({ position: index + 1, prompt })) } })) } } });
    return result;
  }
  const intl = await album('Rock Internacional', categories.get('Rock Internacional')!.id, creator.id);
  await album('Rock Nacional', categories.get('Rock Nacional')!.id, collaborator.id);
  await prisma.albumCollaborator.upsert({ where: { albumId_userId: { albumId: intl.id, userId: collaborator.id } }, update: {}, create: { albumId: intl.id, userId: collaborator.id } });
  console.log(`Seed listo: ${admin.email}, ${creator.email}, ${collaborator.email}; contraseña de desarrollo: AlbumDev123!`);
}
main().finally(() => prisma.$disconnect());
