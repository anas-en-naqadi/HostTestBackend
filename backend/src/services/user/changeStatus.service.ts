import { PrismaClient, user_status } from "@prisma/client";
import { AppError } from "../../middleware/error.middleware";

const prisma = new PrismaClient();

export const changeStatus = async (
  id: number,
  status: user_status
): Promise<void> => {
  // Check if user exists
  const user = await prisma.users.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  await prisma.users.update({
    where: { id: user.id },
    data: { status },
  });

};
