// src/services/dashboard/getFilters.service.ts
import prisma from "../../config/prisma";
import {
  generateCacheKey,
  getFromCache,
  setInCache,
} from "../../utils/cache.utils";

export type FilterOptions = {
  "Video Duration": string[];
  topic: string[];
  level: string[];
  // language: string[];
};

export const getCourseFilterOptions = async (): Promise<FilterOptions> => {
  // 1) Attempt to load from cache
  const cacheKey = generateCacheKey("home", "course-filters");
  const cached = await getFromCache<FilterOptions>(cacheKey);
  if (cached) {
    return cached;
  }

  //   // 3. Languages: distinct language values
  //   const langs = await prisma.courses.findMany({
  //     where: { is_published: true },
  //     select: { language: true },
  //     distinct: ["language"],
  //   });
  //   const languageNames = langs.map((c) => c.language);

  // 2a) Topics: distinct category names
  const topics = await prisma.categories.findMany({
    select: { name: true },
    distinct: ["name"],
  });
  const topicNames = topics.map((c) => c.name);

  // 2b) Levels: distinct difficulty enum values
  const levels = await prisma.courses.findMany({
    where: { is_published: true },
    select: { difficulty: true },
    distinct: ["difficulty"],
  });
  const levelNames = levels.map((c) => c.difficulty);

  // 2c) Duration buckets (total_duration in seconds)
  const buckets = [
    { label: "0 - 1 Hour", min: 0, max: 3600 },
    { label: "1 - 3 Hours", min: 3601, max: 10800 },
    { label: "3 - 6 Hours", min: 10801, max: 21600 },
    { label: "6 - 17 Hours", min: 21601, max: 61200 },
    { label: "17+ Hours", min: 61201, max: Infinity },
  ] as const;

  type DurationLabel = (typeof buckets)[number]["label"];

  const maybeLabels = await Promise.all<DurationLabel | null>(
    buckets.map(async ({ label, min, max }) => {
      const count = await prisma.courses.count({
        where: {
          is_published: true,
          total_duration:
            max === Infinity ? { gte: min } : { gte: min, lte: max },
        },
      });
      return count > 0 ? label : null;
    })
  );
  const durationLabels = maybeLabels.filter(
    (l): l is DurationLabel => l !== null
  );

  const filters: FilterOptions = {
    "Video Duration": durationLabels,
    topic: topicNames,
    level: levelNames,
    // language: languageNames,
  };

  // 3) Save to cache & return
  await setInCache(cacheKey, filters /*, { ttlSeconds: 3600 } */);
  return filters;
};
