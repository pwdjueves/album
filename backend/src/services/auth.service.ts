import argon2 from 'argon2';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { Prisma, type User } from '@prisma/client';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';
import type { ChangePasswordInput, LoginInput, RegisterInput, UpdateProfileInput } from '../validators/auth.validator.js';

type PublicUser = Omit<User, 'passwordHash'>;

export type AuthResult = {
  user: PublicUser;
  token: string;
};

function toPublicUser({ passwordHash: _passwordHash, ...user }: User): PublicUser {
  return user;
}

function createToken(userId: string): string {
  return jwt.sign({}, env.jwtSecret, {
    subject: userId,
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  });
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new AppError('Email is already registered', 409);
    }

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    let user: User;

    try {
      user = await userRepository.create({
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate: new Date(input.birthDate),
        email: input.email,
        passwordHash,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Email is already registered', 409);
      }

      throw error;
    }

    return { user: toPublicUser(user), token: createToken(user.id) };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.isActive || !(await argon2.verify(user.passwordHash, input.password))) {
      throw new AppError('Invalid email or password', 401);
    }

    return { user: toPublicUser(user), token: createToken(user.id) };
  },

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    return toPublicUser(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    return toPublicUser(await userRepository.update(userId, input));
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user || !(await argon2.verify(user.passwordHash, input.currentPassword))) {
      throw new AppError('Current password is invalid', 400);
    }
    await userRepository.update(userId, {
      passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }),
    });
  },
};
