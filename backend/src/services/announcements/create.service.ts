import { PrismaClient, announcements } from "@prisma/client";
import { sendNotification } from "../../utils/notification.utils";
import { CACHE_KEYS, deleteFromCache, generateCacheKey } from "../../utils/cache.utils";

const prisma = new PrismaClient();


export const createAnnouncement = async (
  userId: number,
  data: { courseId: number; title: string; content: string }
): Promise<announcements> => {
  const course = await prisma.courses.findUnique({
    where: { id: data.courseId },
    select: { user: {select:{roles:true,full_name:true}},slug:true,thumbnail_url:true,title:true },
  });
  if (!course || course.user.roles.name === "intern") {
    throw new Error("Course not found or the user is an intern that can't create an annoucements");
  }

  const content = data.content || "";
  
  console.log("data content :",content);

  const announcement = await prisma.announcements.create({
    data: {
      course_id: data.courseId,
      publisher_id: userId,
      title: data.title,
      content: data.content,
    },
  });

 await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE,`learn-${course.slug}`));
  await sendNotification(
    {
      title: "New Announcement",
      user_id: userId,
      type: "ANNOUNCEMENTS",
      content: `${course.user?.full_name} posted a new announcement on the course <b>${course.title}</b>`,
      metadata: {
        courseId: data.courseId,
        slug: course.slug,
        thumbnail_url: course.thumbnail_url,
      },
    },
    userId,
    "instructor"
  );
  
  

  return announcement;
};
