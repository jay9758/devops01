import { Prisma } from '../generated/prisma/client.js';

/** Prisma error code raised when update/delete targets a row that doesn't exist. */
export const PRISMA_RECORD_NOT_FOUND = 'P2025';

export function isRecordNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === PRISMA_RECORD_NOT_FOUND
  );
}
