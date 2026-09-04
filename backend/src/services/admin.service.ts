import { Prisma, UserRole } from '@prisma/client';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';
import type { AuthorizationActor } from './authorization.service.js';
import type { UpdateUserInput } from '../validators/admin.validator.js';

export const adminService = {
  listUsers() {
    return userRepository.list();
  },

  async updateUser(id: string, input: UpdateUserInput, actor: AuthorizationActor) {
    if (id === actor.userId && (input.role === UserRole.USER || input.isActive === false)) {
      throw new AppError('You cannot disable or demote your own admin account', 400);
    }
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    const { passwordHash: _passwordHash, ...publicUser } = await userRepository.update(id, input);
    return publicUser;
  },

  async deleteUser(id: string, actor: AuthorizationActor): Promise<void> {
    if (id === actor.userId) throw new AppError('You cannot delete your own account', 400);
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    try {
      await userRepository.delete(id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError('User cannot be deleted while owned content exists; deactivate the account instead', 409);
      }
      throw error;
    }
  },
};
