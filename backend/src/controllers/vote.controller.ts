import type { Request, Response } from 'express';
import { voteService } from '../services/vote.service.js';
import { AppError } from '../utils/app-error.js';
import type { ValidatedQueryLocals } from '../middleware/validate-query.middleware.js';
import type { RankingQuery } from '../validators/vote.validator.js';

function getAlbumId(request: Request): string {
  const { id } = request.params;
  if (typeof id !== 'string') throw new AppError('Invalid album id', 400);
  return id;
}

function getActor(request: Request) {
  return { userId: request.auth!.userId, role: request.auth!.role };
}

function getOptionalActor(request: Request) {
  return request.auth ? { userId: request.auth.userId, role: request.auth.role } : null;
}

export const voteController = {
  async vote(request: Request, response: Response): Promise<void> {
    const result = await voteService.vote(getAlbumId(request), getActor(request));
    response.status(201).json({ votes: result.count });
  },

  async removeVote(request: Request, response: Response): Promise<void> {
    await voteService.removeVote(getAlbumId(request), getActor(request));
    response.status(204).send();
  },

  async getVotes(request: Request, response: Response): Promise<void> {
    const result = await voteService.getVotes(getAlbumId(request), getOptionalActor(request));
    response.status(200).json({ votes: result.count });
  },

  async ranking(
    request: Request,
    response: Response<unknown, ValidatedQueryLocals<RankingQuery>>,
  ): Promise<void> {
    const ranking = await voteService.ranking(getOptionalActor(request), response.locals.validatedQuery);
    response.status(200).json(ranking);
  },
};
