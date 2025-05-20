import { PrismaClient, announcements } from "@prisma/client";
import { CACHE_KEYS, deleteFromCache, generateCacheKey } from "../../utils/cache.utils";

const prisma = new PrismaClient();

export const updateAnnouncement = async (
  userId: number,
  id: number,
  data: { title: string; content: string }
): Promise<announcements> => {
  const announcement = await prisma.announcements.findUnique({
    where: { id },
    include: { courses: { include: { user: { select: { id: true } } } } },
  });
  if (!announcement || announcement.courses.user?.id !== userId) {
    throw new Error("Announcement not found or unauthorized");
  }

  const updatedAnnouncement = await prisma.announcements.update({
    where: { id },
    data: { title: data.title, content: data.content, updated_at: new Date() },
  });

  await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE,`learn-${announcement.courses.slug}`));


  return updatedAnnouncement;
};
