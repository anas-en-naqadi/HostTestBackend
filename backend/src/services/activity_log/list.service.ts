// src/services/activityLog/list.service.ts

import { PrismaClient } from "@prisma/client";
import {
  ActivityLogResponse,
  PaginatedResponse,
} from "../../types/activity_log.types";

const prisma = new PrismaClient();

type SortBy = "created_at" | "activity_type" | "actor_full_name";
type SortOrder = "asc" | "desc";

/**
 * Fetch paginated activity logs with caching, including the user who did each action and their role.
 */
export const listActivityLogs = async (
  sortBy: SortBy = "created_at",
  sortOrder: SortOrder = "desc"
): Promise<ActivityLogResponse[]> => {
  // Determine the orderBy field for Prisma
  const orderByField =
    sortBy === "actor_full_name"
      ? { users: { full_name: sortOrder } }
      : { [sortBy]: sortOrder };

  // Fetch all data without pagination
  const raw = await prisma.activity_logs.findMany({
    select: {
      id: true,
      user_id: true,
      activity_type: true,
      details: true,
      ip_address: true,
      created_at: true,
      updated_at: true,
      users: {
        select: {
          id: true,
          full_name: true,
          roles: true,
        },
      },
    },
    orderBy: orderByField,
  });

  // Map into ActivityLogResponse
  const logs: ActivityLogResponse[] = raw.map((l) => ({
    id: l.id,
    user_id: l.user_id,
    activity_type: l.activity_type,
    details: l.details ?? undefined,
    ip_address: l.ip_address ?? undefined,
    created_at: l.created_at!,
    actor_full_name: l.users.full_name,
    actor_role: l.users?.roles?.name || "",
  }));

  return logs;
};
