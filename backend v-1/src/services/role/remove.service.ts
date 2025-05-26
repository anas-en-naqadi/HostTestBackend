import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';

const prisma = new PrismaClient();

/**
 * Service to remove a role by its ID
 * @param id Role ID
 * @returns Success message
 */
export const removeRole = async (id: number): Promise<void> => {
  const role = await prisma.roles.findUnique({ where: { id } });
  if (!role) throw new AppError(404, 'Role not found');

  await prisma.roles.delete({
    where: { id },
  });

};
