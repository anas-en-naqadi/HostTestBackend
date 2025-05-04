// src/controllers/course/filter.controller.ts
import { Request, Response } from "express";
import { getCourseFilterOptions } from '../../services/dashboard/getFilters.service';

export const getCourseFiltersController = async (req: Request, res: Response) => {
  try {
    const filters = await getCourseFilterOptions();
     res.json(filters);
  } catch (err) {
    console.error("Error fetching course filters:", err);
     res.status(500).json({ message: "Unable to load filters" });
  }
};
