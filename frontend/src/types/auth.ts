export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';
export type User = { id: string; firstName: string; lastName: string; birthDate: string; email: string; role: UserRole; createdAt: string; updatedAt: string };
export type AuthResponse = { user: User; token: string };
export type LoginInput = { email: string; password: string };
export type RegisterInput = LoginInput & { firstName: string; lastName: string; birthDate: string };
